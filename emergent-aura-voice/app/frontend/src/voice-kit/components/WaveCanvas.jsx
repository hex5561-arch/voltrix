import { useEffect, useRef } from "react";

/** Draws either a static peaks array or a live analyser waveform. */
export const WaveCanvas = ({ peaks, analyser, color = "#06b6d4", height = 96, testId }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = height * dpr;
    };
    resize();
    let raf = 0;
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    if (analyser) {
      const buf = new Float32Array(analyser.fftSize);
      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        drawGrid();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        for (let i = 0; i < buf.length; i++) {
          const x = (i / buf.length) * canvas.width;
          const y = canvas.height / 2 + buf[i] * canvas.height * 1.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        raf = requestAnimationFrame(loop);
      };
      loop();
    } else {
      drawGrid();
      if (peaks?.length) {
        const w = canvas.width / peaks.length;
        const max = Math.max(...peaks, 0.01);
        ctx.fillStyle = color;
        peaks.forEach((p, i) => {
          const h = Math.max(2 * dpr, (p / max) * canvas.height * 0.9);
          ctx.fillRect(i * w + w * 0.2, (canvas.height - h) / 2, w * 0.6, h);
        });
      }
    }
    return () => cancelAnimationFrame(raf);
  }, [peaks, analyser, color, height]);

  return <canvas ref={ref} data-testid={testId} className="block w-full" style={{ height }} />;
};
