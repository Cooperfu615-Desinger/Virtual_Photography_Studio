import profiles from './skirtUnderlayerProfiles.json' with { type: 'json' };

export const SKIRT_LIFT_GESTURE_ID = 'gesture-lift-skirt-both';
export const isSkirtLiftGesture = id => id === SKIRT_LIFT_GESTURE_ID;
export const skirtUnderlayerProfile = item => profiles[item?.id] || '';

const liftPhrases = {
  short: 'both hands gripping opposite sides of the front hem of her skirt and lifting the front skirt panel above her hips',
  gathered: 'both hands gathering the front fabric of her skirt and lifting the gathered skirt fabric above her hips',
  fitted: 'both hands gripping the front of her skirt and drawing the fitted skirt fabric upward along her thighs to above her hips',
  petticoat: 'both hands gathering and lifting the front of her outer skirt and its petticoat together above her hips',
};

export const skirtLiftText = item => liftPhrases[skirtUnderlayerProfile(item)] || '';
