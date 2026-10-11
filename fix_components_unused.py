import sys

# VTubeQuizModal.tsx
file_path = "cloudflare-os/packages/workshop-frontend/src/components/vtube/VTubeQuizModal.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("takeaways.slice(0, 3).map((t, i) => {", "takeaways.slice(0, 3).map((t) => {")
content = content.replace("questions[currentQuestion].options.map((opt, idx) => (", "questions[currentQuestion].options.map((opt, _idx) => (")
content = content.replace("onClick={() => handleAnswer(idx)}", "onClick={() => handleAnswer(_idx)}")
content = content.replace("const handleAnswer = (idx: number) => {", "const handleAnswer = (_idx: number) => {")
with open(file_path, "w") as f:
    f.write(content)

# vtube_.$videoId.tsx
file_path = "cloudflare-os/packages/workshop-frontend/src/routes/vtube_.$videoId.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("const [videoEnded, setVideoEnded] = useState(false);", "")
content = content.replace("setVideoEnded(true);", "")

with open(file_path, "w") as f:
    f.write(content)
