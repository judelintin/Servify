/** Local profile completion never implies marketplace verification or approval. */
export function professionalGuidance(profileComplete: boolean) {
  return profileComplete ? {
    action: 'View your profile', href: '/profile', icon: 'arrow-up-right',
    prompt: 'Your professional introduction is ready on this device.',
    note: 'Required details complete · not verified or published.',
  } as const : {
    action: 'Complete your profile', href: '/professional-setup', icon: 'arrow-up-right',
    prompt: 'Introduce yourself, your services and the work you do.',
    note: 'Local profile only · verification is not yet available.',
  } as const;
}
