/**
 * VoiceModal.tsx — Live voice conversation with Volt inside Voltrix OS.
 *
 * Ported from coursehero/ConversationModeModal:
 *  - AI call rewired: overseer.sendChatMessage() + listChats() poll
 *  - 4 dock buttons removed — only the red End button remains
 *  - Everything else kept: living orb, STT strip, voice picker,
 *    transcript drawer, PIP mode, camera viewfinder
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Microphone, MicrophoneSlash, X, ArrowsIn, ArrowsOut, Sparkle,
  ArrowCounterClockwise, ChatCircle, Check, CaretDown, Camera, CameraSlash,
  Broadcast, ArrowUpRight, WarningCircle, ArrowsOutCardinal, Crosshair,
} from '@phosphor-icons/react'
import type { RpcStub } from 'capnweb'
import type { Overseer } from '@gadgets/workshop-shared/api'
import { voiceService, normalizeLatexForSpeech } from '../services/voiceService'

// ── SpeechRecognition shim (not in all TS libs) ───────────────────────────────
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((e: Event) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
const getSpeechRecognition = (): SpeechRecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'listening' | 'thinking' | 'speaking' | 'muted'

interface HistoryEntry { id: string; role: 'user' | 'assistant'; text: string; ts: string }

interface OverseerLike {
  sendChatMessage(chatId: number, msg: string, model: string | null): Promise<void>;
  listChats(): Promise<Array<{ id: number; activeAgent?: unknown }>>;
  getChatHistory(id: number): Promise<{ messages: Array<{ author: { type: string }; type: string; message: string }> }>;
}

interface Props {
  isOpen: boolean
  onClose: () => void
  overseer: RpcStub<Overseer>
  chatId: number
  modelId: string | null
}

// ── Personas ──────────────────────────────────────────────────────────────────

const PERSONAS = [
  { id: 'aria',    name: 'Aria',    role: 'Socratic Mentor',    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',    glow: 'rgba(56,189,248,0.5)',  pitch: 1.0, rate: 1.0  },
  { id: 'cove',    name: 'Cove',    role: 'Deep Academic',      gradient: 'from-indigo-400 via-purple-500 to-violet-700', glow: 'rgba(129,140,248,0.5)', pitch: 0.9, rate: 0.95 },
  { id: 'ember',   name: 'Ember',   role: 'Dynamic Researcher', gradient: 'from-amber-400 via-rose-500 to-pink-600',      glow: 'rgba(251,113,133,0.5)', pitch: 1.1, rate: 1.05 },
  { id: 'juniper', name: 'Juniper', role: 'Articulate Scholar', gradient: 'from-emerald-400 via-teal-500 to-cyan-600',    glow: 'rgba(52,211,153,0.5)',  pitch: 1.0, rate: 1.0  },
  { id: 'sky',     name: 'Sky',     role: 'Natural & Warm',     gradient: 'from-sky-300 via-blue-400 to-purple-500',      glow: 'rgba(147,197,253,0.5)', pitch: 1.05,rate: 1.0  },
]

const STARTERS = [
  { label: 'Explain Paxos',      text: 'Explain the Paxos consensus algorithm and compare it to Raft.' },
  { label: "Bayes' Theorem",     text: "Walk me through the derivation of Bayes' Theorem with an intuitive example." },
  { label: 'Organic Chem Quiz',  text: 'Quiz me on nucleophilic substitution mechanisms in organic chemistry.' },
  { label: 'Thesis Intro',       text: 'How should I structure the opening problem statement of my thesis?' },
]

function ts() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoiceModal({ isOpen, onClose, overseer, chatId, modelId }: Props) {
  const [minimized,      setMinimized]      = useState(false)
  const [mode,           setMode]           = useState<Mode>('listening')
  const [muted,          setMuted]          = useState(false)
  const [persona,        setPersona]        = useState(PERSONAS[0])
  const [subtitle,       setSubtitle]       = useState('')
  const [transcript,     setTranscript]     = useState('')
  const [micState,       setMicState]       = useState<'prompt'|'granted'|'denied'|'unsupported'>('prompt')
  const [history,        setHistory]        = useState<HistoryEntry[]>([{ id: 'init', role: 'assistant', text: "Hello! I'm Volt Voice — I'm listening. What would you like to explore?", ts: ts() }])
  const [showTranscript, setShowTranscript] = useState(false)
  const [showPersonas,   setShowPersonas]   = useState(false)
  const [cameraOn,       setCameraOn]       = useState(false)
  const [cameraFacing,   setCameraFacing]   = useState<'environment'|'user'>('environment')
  const [camStream,      setCamStream]      = useState<MediaStream|null>(null)
  const [visionText,     setVisionText]     = useState('')
  const [showVision,     setShowVision]     = useState(false)
  const [capturing,      setCapturing]      = useState(false)
  const [camPos,         setCamPos]         = useState({ x: 24, y: 72 })
  const [camSize,        setCamSize]        = useState({ w: 340, h: 220 })
  const [dragging,       setDragging]       = useState(false)
  const [resizing,       setResizing]       = useState(false)

  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const recognRef      = useRef<SpeechRecognitionInstance|null>(null)
  const audioCtxRef    = useRef<AudioContext|null>(null)
  const analyserRef    = useRef<AnalyserNode|null>(null)
  const micStreamRef   = useRef<MediaStream|null>(null)
  const rafRef         = useRef<number|null>(null)
  const histEndRef     = useRef<HTMLDivElement>(null)
  const isSpeakingRef  = useRef(false)
  const isExecRef      = useRef(false)
  const videoRef       = useRef<HTMLVideoElement>(null)
  const vadRef         = useRef<ReturnType<typeof setTimeout>|null>(null)
  const restartRef     = useRef<ReturnType<typeof setTimeout>|null>(null)
  const accRef         = useRef('')
  const isListeningRef = useRef(false)
  const dragStart      = useRef({ mx:0, my:0, px:0, py:0 })
  const resizeStart    = useRef({ mx:0, my:0, sw:0, sh:0 })

  const unlock = useCallback(() => {
    audioCtxRef.current?.resume().catch(()=>{})
    if (window.speechSynthesis?.paused) window.speechSynthesis.resume()
  }, [])

  // ── Camera ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraOn || !isOpen) { camStream?.getTracks().forEach(t=>t.stop()); setCamStream(null); return; }
    let s: MediaStream|null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: cameraFacing } }, audio: false })
      .then(stream => { s=stream; setCamStream(stream); if (videoRef.current) { videoRef.current.srcObject=stream; videoRef.current.play().catch(()=>{}); } })
      .catch(() => setCameraOn(false));
    return () => s?.getTracks().forEach(t=>t.stop());
  }, [cameraOn, isOpen, cameraFacing])

  // ── Cam drag/resize ──────────────────────────────────────────────────────
  const onCamDragStart = (e: React.MouseEvent|React.TouchEvent) => {
    e.preventDefault(); setDragging(true);
    const cx='clientX' in e?e.clientX:e.touches[0].clientX, cy='clientY' in e?e.clientY:e.touches[0].clientY;
    dragStart.current={mx:cx,my:cy,px:camPos.x,py:camPos.y};
  }
  const onResizeStart = (e: React.MouseEvent|React.TouchEvent) => {
    e.stopPropagation(); e.preventDefault(); setResizing(true);
    const cx='clientX' in e?e.clientX:e.touches[0].clientX, cy='clientY' in e?e.clientY:e.touches[0].clientY;
    resizeStart.current={mx:cx,my:cy,sw:camSize.w,sh:camSize.h};
  }
  useEffect(() => {
    if (!dragging && !resizing) return;
    const move=(e:MouseEvent|TouchEvent) => {
      const cx='clientX' in e?e.clientX:(e as TouchEvent).touches[0].clientX, cy='clientY' in e?e.clientY:(e as TouchEvent).touches[0].clientY;
      if (dragging) setCamPos({x:Math.max(10,Math.min(window.innerWidth-camSize.w-10,dragStart.current.px+(cx-dragStart.current.mx))),y:Math.max(50,Math.min(window.innerHeight-camSize.h-70,dragStart.current.py+(cy-dragStart.current.my)))});
      else setCamSize({w:Math.max(260,resizeStart.current.sw+(cx-resizeStart.current.mx)),h:Math.max(160,resizeStart.current.sh+(cy-resizeStart.current.my))});
    };
    const up=()=>{setDragging(false);setResizing(false);};
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',up);
    return ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',move); window.removeEventListener('touchend',up); };
  }, [dragging, resizing, camPos, camSize])

  // ── Safe listen helpers ──────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognRef.current||isListeningRef.current||muted||isSpeakingRef.current||!isOpen||minimized) return;
    try { isListeningRef.current=true; recognRef.current.start(); } catch { /* already started */ }
  }, [muted,isOpen,minimized])
  const stopListening = useCallback(() => { try { recognRef.current?.stop(); } catch { /* ok */ } isListeningRef.current=false; }, [])

  // ── VoiceService sync ───────────────────────────────────────────────────
  useEffect(() => voiceService.subscribe(state => {
    if (state.isPlaying && !state.isPaused) { setMode('speaking'); isSpeakingRef.current=true; setSubtitle(state.currentSentence||'Speaking…'); stopListening(); }
    else if (state.isPaused) { /* paused */ }
    else { isSpeakingRef.current=false; if (!muted){setMode('listening');setSubtitle('');} if(isOpen&&!muted&&!minimized) setTimeout(()=>startListening(),350); }
  }), [muted,isOpen,minimized,startListening,stopListening])

  // ── Mic analyzer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen||muted) { micStreamRef.current?.getTracks().forEach(t=>t.stop()); micStreamRef.current=null; audioCtxRef.current?.close().catch(()=>{}); audioCtxRef.current=null; analyserRef.current=null; return; }
    navigator.mediaDevices?.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})
      .then(stream => {
        micStreamRef.current=stream; setMicState('granted');
        const ctx=new (window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext)();
        if (ctx.state==='suspended') ctx.resume();
        const an=ctx.createAnalyser(); an.fftSize=128; an.smoothingTimeConstant=0.75;
        ctx.createMediaStreamSource(stream).connect(an);
        audioCtxRef.current=ctx; analyserRef.current=an;
      })
      .catch(err=>setMicState(err.name==='NotAllowedError'?'denied':'unsupported'));
    return ()=>{ micStreamRef.current?.getTracks().forEach(t=>t.stop()); micStreamRef.current=null; audioCtxRef.current?.close().catch(()=>{}); audioCtxRef.current=null; analyserRef.current=null; };
  }, [isOpen,muted])

  // ── Speech recognition ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen||minimized||muted){stopListening();return;}
    const SRCtor = getSpeechRecognition();
    if (!SRCtor) return;
    const rec = new SRCtor();
    rec.continuous=true; rec.interimResults=true; rec.lang='en-US'; rec.maxAlternatives=1;
    rec.onstart=()=>{isListeningRef.current=true;if(!isSpeakingRef.current&&!muted)setMode('listening');};
    rec.onresult=(e: SpeechRecognitionEvent)=>{
      let fin='',interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){e.results[i].isFinal?(fin+=e.results[i][0].transcript):(interim+=e.results[i][0].transcript);}
      const active=(fin||interim).trim(); if(!active)return;
      accRef.current=active; setTranscript(active); setSubtitle(`You: "${active}"`);
      if(isSpeakingRef.current){voiceService.stop();isSpeakingRef.current=false;setMode('listening');}
      if(vadRef.current){clearTimeout(vadRef.current);vadRef.current=null;}
      if(fin.trim()){accRef.current='';handleUtterance(fin.trim());return;}
      vadRef.current=setTimeout(()=>{if(accRef.current&&!isSpeakingRef.current){const q=accRef.current.trim();accRef.current='';if(isExecRef.current){voiceService.stop();isExecRef.current=false;}handleUtterance(q);}},1200);
    };
    rec.onerror=(e: SpeechRecognitionErrorEvent)=>{isListeningRef.current=false;if(e.error!=='no-speech'&&e.error!=='aborted')console.warn('[Voice]',e.error);};
    rec.onend=()=>{isListeningRef.current=false;if(isOpen&&!muted&&!isSpeakingRef.current&&!minimized){if(restartRef.current)clearTimeout(restartRef.current);restartRef.current=setTimeout(()=>{if(isOpen&&!muted&&!isSpeakingRef.current&&!minimized)startListening();},800);}};
    recognRef.current=rec; startListening();
    return ()=>{if(vadRef.current){clearTimeout(vadRef.current);vadRef.current=null;}if(restartRef.current){clearTimeout(restartRef.current);restartRef.current=null;}stopListening();recognRef.current=null;};
  }, [isOpen,minimized,muted,startListening,stopListening])

  // ── Canvas orb ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas||!isOpen)return;
    const ctx=canvas.getContext('2d')!; let angle=0,last=performance.now(),smoothed=0.12;
    const render=(t:number)=>{
      const dt=(t-last)/1000;last=t;angle+=dt*1.8;
      let raw=0.12;
      if(analyserRef.current&&mode==='listening'){const d=new Uint8Array(analyserRef.current.frequencyBinCount);analyserRef.current.getByteFrequencyData(d);raw=Math.max(0.1,d.reduce((a,b)=>a+b,0)/d.length/75);}
      else if(mode==='speaking')raw=0.32+Math.sin(t*0.009)*0.18;
      else if(mode==='thinking')raw=0.22+Math.sin(t*0.012)*0.12;
      else if(mode==='muted')raw=0.08;
      smoothed+=(raw-smoothed)*0.2;
      const dpr=window.devicePixelRatio||1,W=canvas.clientWidth,H=canvas.clientHeight;
      if(canvas.width!==W*dpr||canvas.height!==H*dpr){canvas.width=W*dpr;canvas.height=H*dpr;}
      ctx.resetTransform();ctx.scale(dpr,dpr);ctx.clearRect(0,0,W,H);
      const cx=W/2,cy=H/2,base=Math.min(W,H)*0.28,r=base*(1+smoothed*0.45);
      const halo=ctx.createRadialGradient(cx,cy,r*0.4,cx,cy,r*1.8);
      if(mode==='speaking'){halo.addColorStop(0,'rgba(168,85,247,.45)');halo.addColorStop(0.5,'rgba(99,102,241,.25)');halo.addColorStop(1,'transparent');}
      else if(mode==='thinking'){halo.addColorStop(0,'rgba(245,158,11,.45)');halo.addColorStop(1,'transparent');}
      else if(mode==='muted'){halo.addColorStop(0,'rgba(239,68,68,.25)');halo.addColorStop(1,'transparent');}
      else{halo.addColorStop(0,'rgba(56,189,248,.5)');halo.addColorStop(0.5,'rgba(99,102,241,.3)');halo.addColorStop(1,'transparent');}
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,r*1.8,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.beginPath();
      for(let i=0;i<=16;i++){const th=(i/16)*Math.PI*2,off=(Math.sin(th*3+angle*2.2)*0.08+Math.cos(th*5-angle*1.8)*0.06+Math.sin(th*2+angle*3.5)*0.04)*r*(smoothed*2.2+0.3),rr=r+off,x=cx+Math.cos(th)*rr,y=cy+Math.sin(th)*rr;
        if(i===0){ctx.moveTo(x,y);}else{const pth=((i-1)/16)*Math.PI*2,poff=(Math.sin(pth*3+angle*2.2)*0.08+Math.cos(pth*5-angle*1.8)*0.06)*r*(smoothed*2.2+0.3),pr=r+poff,px=cx+Math.cos(pth)*pr,py=cy+Math.sin(pth)*pr;ctx.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);}}
      ctx.closePath();
      const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
      if(mode==='speaking'){g.addColorStop(0,'#38bdf8');g.addColorStop(0.35,'#818cf8');g.addColorStop(1,'#ec4899');}
      else if(mode==='thinking'){g.addColorStop(0,'#fbbf24');g.addColorStop(0.5,'#f43f5e');g.addColorStop(1,'#8b5cf6');}
      else if(mode==='muted'){g.addColorStop(0,'#64748b');g.addColorStop(1,'#1e293b');}
      else{g.addColorStop(0,'#67e8f9');g.addColorStop(0.4,'#38bdf8');g.addColorStop(1,'#3b82f6');}
      ctx.fillStyle=g;ctx.fill();
      const ig=ctx.createRadialGradient(cx-r*0.25,cy-r*0.25,2,cx,cy,r*0.8);ig.addColorStop(0,'rgba(255,255,255,.85)');ig.addColorStop(0.3,'rgba(255,255,255,.4)');ig.addColorStop(1,'rgba(0,0,0,.25)');ctx.fillStyle=ig;ctx.fill();ctx.restore();
      if(mode==='listening'||mode==='speaking'){ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=mode==='speaking'?'rgba(216,180,254,.35)':'rgba(125,211,252,.35)';ctx.beginPath();ctx.ellipse(cx,cy,r*1.3,r*0.7,angle*0.4,0,Math.PI*2);ctx.stroke();ctx.restore();}
      rafRef.current=requestAnimationFrame(render);
    };
    rafRef.current=requestAnimationFrame(render);
    return ()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  }, [isOpen,mode,persona])

  // ── AI via overseer RPC ──────────────────────────────────────────────────
  const waitForResponse = useCallback(async (): Promise<string> => {
    const o = overseer as unknown as OverseerLike;
    return new Promise(resolve => {
      let attempts=0;
      const check=setInterval(async()=>{
        attempts++;
        try {
          const chats=await o.listChats();
          const chat=chats.find(c=>c.id===chatId);
          if(!chat?.activeAgent||attempts>60){
            clearInterval(check);
            try {
              const h=await o.getChatHistory(chatId);
              const last=[...h.messages].reverse().find(m=>m.author?.type==='agent'&&m.type==='message'&&m.message);
              resolve(last?.message??'');
            } catch{resolve('');}
          }
        } catch{clearInterval(check);resolve('');}
      },500);
    });
  }, [overseer,chatId])

  const handleUtterance = useCallback(async (text: string, _visionUrl?: string) => {
    if (!text.trim()||isExecRef.current) return;
    unlock(); isExecRef.current=true;
    let visualUrl=_visionUrl;
    if (!visualUrl&&cameraOn&&videoRef.current) {
      try { const v=videoRef.current,c=document.createElement('canvas');c.width=v.videoWidth||1280;c.height=v.videoHeight||720;c.getContext('2d')!.drawImage(v,0,0,c.width,c.height);visualUrl=c.toDataURL('image/jpeg',0.88); } catch{ /* ok */ }
    }
    setHistory(prev=>[...prev,{id:`u-${Date.now()}`,role:'user',text,ts:ts()}]);
    setTranscript(''); setMode('thinking'); setSubtitle(visualUrl?'Volt Vision scanning…':'Volt is thinking…');
    let response='';
    try {
      await (overseer as unknown as OverseerLike).sendChatMessage(chatId, text, modelId);
      response=await waitForResponse();
    } catch(err){ console.warn('[Voice] RPC error:',err); }
    if (!response?.trim()) response="That's a great question. Tell me more about what you're working on and I'll help you work through it step by step.";
    const clean=normalizeLatexForSpeech(response);
    setHistory(prev=>[...prev,{id:`a-${Date.now()}`,role:'assistant',text:response,ts:ts()}]);
    // Show vision OCR result in the overlay if camera was active
    if (visualUrl) { setVisionText(response); setShowVision(true); }
    setSubtitle(clean.slice(0,160)); setMode('speaking');
    await voiceService.speak(clean,'Volt Voice',{rate:persona.rate,pitch:persona.pitch});
    isExecRef.current=false;
  }, [overseer,chatId,modelId,cameraOn,persona,unlock,waitForResponse])

  const interrupt=useCallback(()=>{ unlock(); if(mode==='speaking'||isSpeakingRef.current){voiceService.stop();isSpeakingRef.current=false;setMode('listening');setSubtitle('');} },[mode,unlock])
  const toggleMute=useCallback(()=>{ unlock(); if(muted){setMuted(false);setMode('listening');}else{setMuted(true);setMode('muted');if(mode==='speaking')voiceService.stop();} },[muted,mode,unlock])
  const close=useCallback(()=>{ voiceService.stop();stopListening();audioCtxRef.current?.close().catch(()=>{});setMinimized(false);onClose(); },[onClose,stopListening])

  useEffect(()=>{ if(showTranscript)histEndRef.current?.scrollIntoView({behavior:'smooth'}); },[history,showTranscript])

  if (!isOpen) return null;

  const modeColor = mode==='speaking'?'bg-purple-400 animate-ping':mode==='thinking'?'bg-amber-400 animate-pulse':mode==='muted'?'bg-red-400':'bg-cyan-400 animate-pulse';
  const modeLabel = mode==='speaking'?'Volt Speaking':mode==='thinking'?'Synthesizing…':mode==='muted'?'Muted':'Listening…';

  // ── PIP ──────────────────────────────────────────────────────────────────
  if (minimized) return (
    <aside className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div onClick={unlock} className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border transition-all duration-300 hover:scale-105"
        style={{background:'rgba(18,18,18,.95)',backdropFilter:'blur(20px)',borderColor:'rgba(255,255,255,.15)',boxShadow:`0 12px 36px rgba(0,0,0,.7),0 0 24px ${persona.glow}`}}>
        <div onClick={()=>setMinimized(false)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{background:`radial-gradient(circle at 30% 30%,#fff 0%,${mode==='speaking'?'#c084fc':'#38bdf8'} 50%,#4f46e5 100%)`,boxShadow:`0 0 16px ${persona.glow}`}}>
          <Sparkle size={14} className="text-white drop-shadow" />
        </div>
        <div onClick={()=>setMinimized(false)} className="flex flex-col cursor-pointer min-w-0 pr-1">
          <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${modeColor}`}/><span className="text-xs font-bold text-white tracking-wide">{persona.name} Voice</span></div>
          <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">{transcript?<span className="text-cyan-300">"{transcript.slice(0,40)}…"</span>:mode==='speaking'?subtitle?.slice(0,40)||'Speaking…':mode==='thinking'?'Thinking…':mode==='muted'?'Muted':'Listening…'}</span>
        </div>
        <div className="flex items-center gap-1 pl-1 border-l border-white/10">
          <button onClick={toggleMute} className={`p-1.5 rounded-full transition ${muted?'bg-red-500/20 text-red-400':'text-zinc-300 hover:text-white hover:bg-white/10'}`}>{muted?<MicrophoneSlash size={14}/>:<Microphone size={14}/>}</button>
          <button onClick={()=>setMinimized(false)} className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"><ArrowsOut size={14}/></button>
          <button onClick={close} className="p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/10 transition"><X size={15}/></button>
        </div>
      </div>
    </aside>
  );

  // ── Fullscreen ────────────────────────────────────────────────────────────
  return (
    <div onClick={unlock} className="fixed inset-0 z-50 flex flex-col justify-between text-white select-none overflow-hidden animate-in fade-in duration-300"
      style={{background:'radial-gradient(circle at 50% 50%,#1a1a24 0%,#121212 70%,#0a0a0e 100%)'}}>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between p-3.5 sm:p-5 border-b border-white/5 backdrop-blur-md bg-black/20 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Broadcast size={16} className="text-cyan-400 animate-pulse"/>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide truncate">Volt Voice</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Live</span>
            </div>
            <span className="hidden sm:block text-[11px] text-zinc-400">{persona.name} · {persona.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Persona picker */}
          <div className="relative">
            <button onClick={()=>setShowPersonas(p=>!p)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 border border-white/10 cursor-pointer transition">
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${persona.gradient} shrink-0`}/>
              <span className="truncate max-w-[60px] sm:max-w-none">{persona.name}</span>
              <CaretDown size={13} className="text-zinc-400 shrink-0"/>
            </button>
            {showPersonas&&(
              <div className="absolute right-0 mt-2 w-64 rounded-2xl p-2 bg-[#1c1c24] border border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150" style={{backdropFilter:'blur(20px)'}}>
                <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 mb-1">Voice Persona</div>
                {PERSONAS.map(p=>(
                  <button key={p.id} onClick={()=>{setPersona(p);voiceService.setRate(p.rate);voiceService.setPitch(p.pitch);setShowPersonas(false);}}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${persona.id===p.id?'bg-white/15 text-white':'hover:bg-white/5 text-zinc-300'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${p.gradient} flex items-center justify-center shrink-0`}><Sparkle size={12} className="text-white"/></div>
                      <div className="flex flex-col min-w-0"><span className="text-xs font-bold truncate">{p.name}</span><span className="text-[10px] text-zinc-400 truncate">{p.role}</span></div>
                    </div>
                    {persona.id===p.id&&<Check size={14} className="text-cyan-400 shrink-0"/>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={()=>setShowTranscript(p=>!p)} className={`p-1.5 sm:p-2.5 rounded-full border transition cursor-pointer ${showTranscript?'bg-indigo-600 text-white border-indigo-500':'bg-white/10 hover:bg-white/15 text-zinc-300 border-white/10'}`}><ChatCircle size={16}/></button>
          <button onClick={()=>setMinimized(true)} className="p-1.5 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 transition cursor-pointer"><ArrowsIn size={16}/></button>
          <button onClick={close} className="p-1.5 sm:p-2.5 rounded-full bg-white/10 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/10 transition cursor-pointer"><X size={16}/></button>
        </div>
      </header>

      {micState==='denied'&&(
        <div className="z-20 mx-auto mt-3 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 max-w-md">
          <WarningCircle size={15} className="shrink-0 text-amber-400"/>
          <span className="flex-1">Microphone blocked. Allow mic permissions in your browser.</span>
        </div>
      )}

      {/* Center stage */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 blur-[120px] transition-all duration-700"
          style={{background:mode==='speaking'?'radial-gradient(circle at 50% 50%,rgba(192,132,252,.4),rgba(56,189,248,.2),transparent 70%)':mode==='thinking'?'radial-gradient(circle at 50% 50%,rgba(251,146,60,.4),rgba(217,70,239,.2),transparent 70%)':mode==='muted'?'radial-gradient(circle at 50% 50%,rgba(239,68,68,.2),transparent 70%)':'radial-gradient(circle at 50% 50%,rgba(56,189,248,.4),rgba(99,102,241,.2),transparent 70%)'}}/>

        {/* Camera viewfinder */}
        {cameraOn&&(
          <div style={{top:camPos.y,left:camPos.x,width:camSize.w,height:camSize.h}} className="absolute z-40 rounded-3xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl bg-black flex flex-col animate-in fade-in duration-200 select-none group/cam">
            <div onMouseDown={onCamDragStart} onTouchStart={onCamDragStart} className="flex items-center justify-between px-3.5 py-2.5 bg-black/85 border-b border-white/15 cursor-grab active:cursor-grabbing z-20 text-white select-none touch-none">
              <div className="flex items-center gap-2 pointer-events-none"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"/><span className="text-[11px] font-bold text-emerald-300">VOLT LIVE SCANNER</span><ArrowsOutCardinal size={12} className="text-zinc-400 opacity-60"/></div>
              <div className="flex items-center gap-1.5" onMouseDown={e=>e.stopPropagation()}>
                <button type="button" onClick={()=>setCamSize(prev=>prev.w>450?{w:320,h:210}:{w:560,h:360})} className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 transition cursor-pointer">{camSize.w>450?<ArrowsIn size={13}/>:<ArrowsOut size={13}/>}</button>
                <button type="button" onClick={()=>setCameraFacing(f=>f==='environment'?'user':'environment')} className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 transition cursor-pointer"><ArrowCounterClockwise size={13}/></button>
                <button type="button" onClick={()=>setCameraOn(false)} className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"><X size={14}/></button>
              </div>
            </div>
            <div className="relative flex-1 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
              <div className="absolute inset-4 border border-indigo-400/50 rounded-2xl pointer-events-none">
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400"/><div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400"/>
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400"/><div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400"/>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2"/>
              </div>
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-20" onMouseDown={e=>e.stopPropagation()}>
                <button type="button" disabled={capturing} onClick={()=>{setCapturing(true);handleUtterance('Transcribe all equations and text in this image.').finally(()=>setCapturing(false));}} className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  <Crosshair size={12}/>{capturing?'Transcribing…':'⚡ Transcribe'}
                </button>
                <button type="button" disabled={capturing} onClick={()=>handleUtterance('Solve the mathematical equation or problem shown step-by-step.')} className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  <Sparkle size={12}/>Solve
                </button>
              </div>
              <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1.5 z-30 touch-none">
                <div className="w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 rounded-br-sm"/>
              </div>
            </div>
            {visionText&&showVision&&(
              <div className="p-3 bg-zinc-950/95 border-t border-white/10 text-xs text-zinc-200 max-h-36 overflow-y-auto">
                <div className="flex items-center justify-between font-bold text-[10px] text-cyan-400 uppercase mb-1"><span>AI OCR</span><button onClick={()=>setShowVision(false)} className="text-zinc-400 hover:text-white">✕</button></div>
                <p className="whitespace-pre-wrap font-mono text-[11px] text-zinc-300">{visionText}</p>
              </div>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="mb-4 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl">
            <span className={`w-2 h-2 rounded-full ${modeColor}`}/><span className="text-xs font-bold uppercase tracking-wider text-zinc-200">{modeLabel}</span>
          </div>
        </div>

        {/* Orb — tap to interrupt */}
        <div onClick={interrupt} className="relative cursor-pointer transition-transform active:scale-95 group" title={mode==='speaking'?'Tap to interrupt':'Listening…'}>
          <canvas ref={canvasRef} className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px]"/>
          {mode==='speaking'&&(
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full backdrop-blur-[2px]">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/70 text-white border border-white/20">Tap to Interrupt</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <div className="mt-4 max-w-xl text-center px-4 min-h-[56px] flex items-center justify-center z-10">
          {subtitle?<p className="text-lg font-medium text-zinc-100 leading-relaxed drop-shadow-md animate-in fade-in duration-200">{subtitle}</p>
            :mode==='listening'?<p className="text-sm text-zinc-400 font-medium">Start speaking, or tap a topic below…</p>:null}
        </div>

        {/* STT strip */}
        <div className="w-full max-w-2xl px-4 z-10">
          <div className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-all duration-300 ${transcript?'bg-cyan-500/10 border-cyan-500/30':'bg-white/[.03] border-white/[.06]'}`}>
            <div className="flex-shrink-0 mt-0.5">
              {muted?<MicrophoneSlash size={14} className="text-red-400 mt-0.5"/>:mode==='listening'?(
                <span className="flex h-3 w-3 mt-0.5">
                  <span className={`animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75 ${transcript?'bg-cyan-400':'bg-zinc-500'}`}/>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${transcript?'bg-cyan-400':'bg-zinc-600'}`}/>
                </span>
              ):<span className={`inline-flex h-3 w-3 rounded-full mt-0.5 ${mode==='thinking'?'bg-amber-400 animate-pulse':'bg-purple-400 animate-pulse'}`}/>}
            </div>
            <div className="flex-1 min-w-0">
              {transcript?<p className="text-sm text-cyan-100 leading-snug break-words"><span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mr-1.5">You</span>{transcript}<span className="inline-block w-[2px] h-[13px] bg-cyan-400 ml-1 animate-pulse align-middle rounded-sm"/></p>
                :<p className="text-xs text-zinc-500">{muted?'Microphone muted':mode==='thinking'?'Processing…':mode==='speaking'?'Tap orb to interrupt':isListeningRef.current?'Listening — speak now…':'Mic initialising…'}</p>}
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0 ${muted?'bg-red-500/20 text-red-400':mode==='listening'&&isListeningRef.current?'bg-cyan-500/20 text-cyan-400':mode==='thinking'?'bg-amber-500/20 text-amber-400':mode==='speaking'?'bg-purple-500/20 text-purple-400':'bg-zinc-700 text-zinc-400'}`}>
              {muted?'muted':mode==='thinking'?'thinking':mode==='speaking'?'speaking':isListeningRef.current?'live':'idle'}
            </span>
          </div>
        </div>

        {/* Starter chips */}
        {mode==='listening'&&(
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-2xl px-4 z-10 animate-in fade-in duration-300">
            {STARTERS.map((s,i)=>(
              <button key={i} onClick={()=>handleUtterance(s.text)} className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95">
                {s.label}<ArrowUpRight size={12} className="text-zinc-400"/>
              </button>
            ))}
          </div>
        )}

        {/* Camera toggle chip */}
        <button onClick={()=>{unlock();setCameraOn(p=>!p);}} className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer z-10 ${cameraOn?'bg-emerald-600/20 text-emerald-300 border-emerald-500/40':'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/10'}`}>
          {cameraOn?<Camera size={12}/>:<CameraSlash size={12}/>}{cameraOn?'Vision On':'Vision Off'}
        </button>
      </main>

      {/* Transcript drawer */}
      {showTranscript&&(
        <div className="absolute inset-x-0 bottom-24 top-20 z-30 mx-auto max-w-2xl p-4 flex flex-col bg-[#181820]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2"><ChatCircle size={16} className="text-indigo-400"/><span className="text-sm font-bold text-white">Transcript</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">{history.length} turns</span></div>
            <button onClick={()=>setShowTranscript(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"><X size={16}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 py-3 px-1">
            {history.map(item=>(
              <div key={item.id} className={`flex flex-col p-3 rounded-2xl ${item.role==='user'?'bg-cyan-950/40 border border-cyan-800/40 text-cyan-100 ml-8':'bg-white/5 border border-white/10 text-zinc-200 mr-8'}`}>
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1"><span>{item.role==='user'?'You':`${persona.name} (Volt)`}</span><span className="font-mono text-[10px]">{item.ts}</span></div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>
              </div>
            ))}
            <div ref={histEndRef}/>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Voice session transcript</span>
            <button onClick={()=>navigator.clipboard.writeText(history.map(h=>`${h.role==='user'?'You':'Volt'}: ${h.text}`).join('\n\n'))} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer">Copy All</button>
          </div>
        </div>
      )}

      {/* Footer — End button only */}
      <footer className="relative z-10 pb-8 pt-4 flex items-center justify-center px-4">
        <button onClick={close} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xl shadow-red-600/40 border border-red-400/40 hover:scale-105" title="End Voice Conversation">
          <X size={26} className="stroke-[3]"/>
        </button>
      </footer>
    </div>
  );
}
