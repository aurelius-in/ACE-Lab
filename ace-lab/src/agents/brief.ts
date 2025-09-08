export type LookProfile = {
  palette: string[];
  vibe: string;
  contrastCurve: number;
  motionFeel: 'calm'|'energetic';
  params: Record<string, number>;
};

export function briefFromPrompt(prompt: string): LookProfile {
  const p = prompt.toLowerCase();
  const warm = /warm|retro|print|sunset|orchid|pink/.test(p);
  const grain = /grain|film|noise/.test(p);
  const energetic = /energetic|punch|bold|fast/.test(p);

  const params: Record<string, number> = {
    dotScale: warm ? 10 : 8,
    angleRad: energetic ? 0.9 : 0.6,
    contrast: warm ? 1.1 : 1.0,
    invert01: 0,
  };
  if (grain) {
    // emulate grain by slightly boosting contrast
    params.contrast += 0.05;
  }

  return {
    palette: ['#6E00FF', '#A83CF0', '#FF4BB5'],
    vibe: warm ? 'warm retro print' : 'neutral',
    contrastCurve: params.contrast,
    motionFeel: energetic ? 'energetic' : 'calm',
    params,
  };
}


