/** All user-facing copy for v1 — en-GB, sentence case, no emoji. */

export const strings = {
  brand: {
    name: 'Sentient',
  },

  choose: {
    whatDoYouNeed: 'What do you need?',
    intentDoTitle: 'What can I do?',
    intentDoSubtitle: 'Help me say this well.',
    intentMissingTitle: 'What am I missing?',
    intentMissingSubtitle: 'Help me see what I might be overlooking.',
    understandingEyebrow: 'How do you want to be understood?',
    roughDraftLabel: 'Your rough draft — optional',
    replyingTo: (name: string) => `You're replying to ${name}`,
    pasteMessageLabel: 'Paste the message you want to improve',
    pasteMessagePlaceholder: 'Paste or type the message here',
    pasteMessageRequired: 'Paste or type a message first.',
  },

  compare: {
    doHeader: (understanding: string) => `${understanding} replies`,
    missingHeader: 'Before you reply',
    optionsPill: '3 options',
    perspectiveEyebrow: 'What you might be missing',
    regenerateDo: 'Try another way to be understood',
    regenerateMissing: 'See another angle',
    recommended: 'Recommended',
    copy: 'Copy',
    sendBack: 'Send back',
  },

  sendBack: {
    readyToSend: 'Ready to send',
    perspectiveTag: 'Perspective',
    reassurance:
      'Nothing sends automatically. Sentient copies your reply, then takes you back so you can paste and hit send yourself.',
    copyAndSwitch: (app: string) => `Copy & switch to ${app}`,
    backToOptions: 'Back to the options',
    copiedToast: 'Copied to clipboard',
  },

  setup: {
    welcome: 'Welcome to Sentient',
    body: 'A clearer reply is two taps away. First, two quick permissions so Sentient can reach your chats.',
    shareSheetTitle: 'Add to your Share sheet',
    shareSheetSubtitle: 'Share any message straight to Sentient',
    overlayTitle: 'Draw over other apps',
    overlaySubtitle: 'Open Sentient from any chat with the bubble',
    keyboardTitle: 'Turn on the keyboard',
    keyboardSubtitle: 'Optional — improve as you type',
    keyboardComingSoon: 'Coming soon',
    privacyReassurance:
      'Sentient only reads a message when you share it. It never watches your chats in the background.',
    continue: 'Continue',
    signIn: 'Sign in to sync your rewrites',
  },

  auth: {
    title: 'Sign in',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    signInTab: 'Sign in',
    signUpTab: 'Create account',
    signInButton: 'Sign in',
    signUpButton: 'Create account',
    configError:
      'Sentient is not connected yet. Add your Supabase URL and key to .env and restart the app.',
    signInError: "Couldn't sign you in — check your email and password.",
    signUpError: "Couldn't create your account — try a different email or password.",
    emailNotConfirmed: 'Confirm your email first — check your inbox for the link we sent you.',
    confirmEmailTitle: 'Check your email',
    confirmEmailBody:
      "We've sent a confirmation link to your email. Follow it, then come back and sign in.",
    signedInTitle: "You're signed in",
    signedInBody: (email: string) => `Signed in as ${email}. Your history will sync from here.`,
    syncBenefit: 'Sign in to keep your rewrite history backed up and available on every device.',
    forgotPassword: 'Forgot password?',
    backToSignIn: 'Back to sign in',
    resetTitle: 'Reset password',
    resetBody: "Enter your email and we'll send you a link to reset your password.",
    resetEmailRequired: 'Enter your email first.',
    resetSendButton: 'Send reset link',
    resetSentConfirmation:
      "If there's an account for that email, we've sent a link to reset your password.",
    resetLinkInvalid: 'This reset link is no longer valid — request a new one.',
    resetPasswordBody: 'Choose a new password for your account.',
    resetNewPasswordLabel: 'New password',
    resetConfirmPasswordLabel: 'Confirm password',
    resetPasswordSubmit: 'Save new password',
    resetPasswordTooShort: 'Password must be at least 8 characters.',
    resetPasswordMismatch: "Passwords don't match.",
    resetPasswordError: "Couldn't reset your password — try requesting a new link.",
    resetPasswordSuccess: 'Your password has been reset.',
    resetContinue: 'Continue',
  },

  capture: {
    quickActionDo: 'What can I do?',
    quickActionMissing: 'What am I missing?',
    selectedFrom: (app: string) => `Selected from ${app}`,
  },

  errors: {
    moderation: 'Something here needs another look.',
    network: "Couldn't reach Sentient — try again.",
  },

  pro: {
    limitReached: "You've used your 5 rewrites for today.",
    nudge: 'Go Pro for unlimited rewrites.',
  },

  history: {
    title: 'Your rewrites',
    searchPlaceholder: 'Search people or messages',
    empty: 'No rewrites yet — your saved replies will appear here.',
    emptySearch: 'No matches yet — clear the search to get back to everything.',
    perspectivePill: 'Perspective',
    tabs: {
      home: 'Home',
      history: 'History',
      you: 'You',
    },
  },

  home: {
    eyebrow: 'Sentient',
    title: 'Say it well, before you send',
    body: 'Share a message from any chat, pick how you want to be understood, and choose the reply that sounds like you.',
    cta: 'Improve a message',
  },

  settings: {
    title: 'Settings',
    account: 'Account',
    accountSignedIn: 'Signed in',
    accountSignedOut: 'Sign in to sync your history',
    accountSyncBenefit: 'Keep your rewrites backed up and available on every device.',
    signOut: 'Sign out',
    defaults: 'Defaults',
    defaultUnderstanding: 'Default understanding',
    beforeAnythingSends: 'Before anything sends',
    editBeforeSend: 'Always let me edit first',
    editBeforeSendSubtitle: 'Sentient never sends on its own',
    saveHistory: 'Save my rewrite history',
    saveHistorySubtitle: 'Kept private to your account',
    proTitle: 'Sentient Pro',
    proBody: 'Unlimited rewrites, every way to be understood',
    proCta: 'Go Pro',
    proPrice: '€3.99 / month',
    proActiveBody: "You're on Sentient Pro. Unlimited rewrites, every way to be understood.",
    proNoOfferings: "Sentient Pro isn't available to purchase right now — try again shortly.",
  },

  android: {
    openFullOptions: 'Open full options in Sentient',
    onApp: (app: string) => `on ${app}`,
  },
} as const;
