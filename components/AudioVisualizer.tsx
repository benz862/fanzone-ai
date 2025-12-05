import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  dataArray: Uint8Array | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ dataArray, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Idle State
      if (!isActive || !dataArray) {
        ctx.beginPath();
        // Subtle breathing line
        const time = Date.now() / 1000;
        const y = height / 2 + Math.sin(time * 2) * 2;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        requestAnimationFrame(draw);
        return;
      }

      // Check for silence (if all zeros)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      if (sum === 0) {
        // Draw flat line if silence
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        requestAnimationFrame(draw);
        return;
      }

      // Draw Dancing Waveform (Mirrored Bars with rounded caps)
      const bufferLength = dataArray.length;
      // We only use the lower half of frequency data for better visuals (bass/mids)
      const usableLength = Math.floor(bufferLength * 0.7); 
      const barWidth = (width / usableLength) * 0.8;
      let x = (width - (usableLength * (barWidth + 2))) / 2; // Center alignment

      for (let i = 0; i < usableLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = Math.max(4, percent * height * 0.8); // Scale height
        
        const centerY = height / 2;
        
        // Gradient Color based on amplitude
        const r = 59 + (147 - 59) * percent; // Blue to Purple
        const g = 130 + (51 - 130) * percent;
        const b = 246 + (234 - 246) * percent;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        // Glow Effect
        ctx.shadowBlur = 10 * percent;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 5);
        ctx.fill();

        x += barWidth + 2; // Spacing
      }
      
      // Reset Shadow
      ctx.shadowBlur = 0;
      
      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [dataArray, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={120} 
      className="w-full h-full"
    />
  );
};