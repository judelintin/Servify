/** Presentation policy only. Stage 01 has no editable or completed professional profiles. */
export function professionalGuidance(profileComplete: boolean) {
  return profileComplete ? {
    action: 'Find jobs', href: '/jobs', icon: 'search',
    prompt: 'Explore requests relevant to your services and areas.',
    note: 'Job discovery is not connected in this preview.',
  } as const : {
    action: 'Complete your profile', href: '/professional-setup', icon: 'arrow-up-right',
    prompt: 'Next: Professional introduction.',
    note: 'Setup preview · editing comes in a later stage.',
  } as const;
}
