export function createThunderSampleSets(base) {
  const prefix = `${base.replace(/\/$/, '')}/thunder/`;
  return {
    showcase: [
      { url: `${prefix}low-thunder.mp3`, gain: .46, delay: 0 },
      { url: `${prefix}medium-thunder.mp3`, gain: .34, delay: .06 },
      { url: `${prefix}big-thunder.mp3`, gain: .20, delay: .16 },
    ],
    details: [
      { url: `${prefix}medium-thunder-project-details.mp3`, gain: .50, delay: 0 },
      { url: `${prefix}medium-thunder-2-project-details.mp3`, gain: .30, delay: .10 },
      { url: `${prefix}medium-thunder-3-project-details.mp3`, gain: .20, delay: .20 },
    ],
  };
}

export function mixThunderSamples(context, layers) {
  const available = layers.filter(layer => layer.buffer && layer.gain > 0);
  if (!available.length) return null;
  if (available.length === 1 && !available[0].delay) return available[0].buffer;
  const duration = Math.max(...available.map(layer => layer.buffer.duration + layer.delay));
  const channels = Math.min(2, Math.max(...available.map(layer => layer.buffer.numberOfChannels)));
  const mixed = context.createBuffer(channels, Math.ceil(duration * context.sampleRate), context.sampleRate);
  const totalGain = available.reduce((total, layer) => total + layer.gain, 0);
  for (const { buffer, gain, delay } of available) {
    const offset = Math.round(delay * context.sampleRate);
    const fadeFrames = Math.max(1, Math.round(context.sampleRate * .012));
    for (let channel = 0; channel < channels; channel++) {
      const source = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      const output = mixed.getChannelData(channel);
      const count = Math.min(source.length, output.length - offset);
      for (let index = 0; index < count; index++) {
        const fade = Math.min(1, index / fadeFrames, (count - 1 - index) / fadeFrames);
        output[index + offset] += source[index] * gain / totalGain * fade;
      }
    }
  }
  return mixed;
}
