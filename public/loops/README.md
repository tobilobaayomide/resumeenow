Place your recorded product loops in this folder using these exact filenames:

- `feature-upload.mp4`
- `feature-editor.mp4`
- `feature-ai.mp4`
- `feature-pro.mp4`
- `step-01.mp4`
- `step-02.mp4`
- `step-03.mp4`

Recommended settings:

- 5-8 seconds
- 1280px width
- 24fps
- no audio
- H.264 `.mp4` (`yuv420p`)

Quick conversion command:

```bash
npm run loop:make -- <input.mp4> public/loops/feature-upload.mp4 00:00:02 6
```

If a file is missing, landing sections automatically fall back to the demo placeholder video.
