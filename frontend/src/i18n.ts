export type Language = "en" | "ta" | "si";

export const LANGUAGES: { id: Language; label: string; nativeName: string }[] = [
  { id: "en", label: "English", nativeName: "English" },
  { id: "ta", label: "Tamil", nativeName: "தமிழ்" },
  { id: "si", label: "Sinhala", nativeName: "සිංහල" },
];

export const translations = {
  en: {
    // Header & Workspace
    headerNote: "Research video workspace",
    logOut: "Log out",
    workspace: "WORKSPACE",
    humanReviewed: "HUMAN-REVIEWED DATA",
    noAutomatedSigning: "No automated signing assessment",

    // Navigation for Teacher
    navRecord: "Record sentences",
    navReview: "My recordings",
    navConsent: "Consent & withdrawal",

    // Login / Register Page
    brandSubtitle: "Sign-language research video collection",
    brandDesc:
      "This research platform collects sign-language translations of public-service sentences. Teachers see one sentence, record its meaning in sign, and upload the video for the research team.",
    scopeText: "Hospital reception · Transport · Bank counters",
    howItWorksTitle: "How the collection works",
    step1: "Read the sentence shown on screen.",
    step2: "Record yourself signing its meaning, without audio.",
    step3: "Upload the video and continue to the next sentence.",
    step4: "Complete the collection when you are ready.",
    loginNotice:
      "Videos are private. Administrators can review recordings and download consent-eligible videos with their sentence transcripts. No automatic translation or emotion inference is performed.",
    welcomeBack: "Welcome back",
    createTeacherAccount: "Create a teacher account",
    loginInstructions:
      "Log in with your contributor code. Teachers can register a new account here; an administrator assigns recording prompts.",
    registerInstructions:
      "Choose a contributor code and a password of at least 12 characters. An administrator must assign prompts before you can record.",
    contributorCodeLabel: "Contributor code",
    passwordLabel: "Password",
    loginBtn: "Log in securely →",
    registerBtn: "Register and continue",
    alreadyHaveAccount: "I already have an account",
    registerAsTeacher: "Register as a teacher",
    accessPrivateNotice: "Access is private. Videos may identify contributors.",

    // Consent Page
    consentEyebrow: "YOUR PERMISSIONS · VERSION 1.0",
    consentTitle: "Informed consent",
    consentDesc: "Choose separately how your signing recordings may be used.",
    beforeYouRecord: "Before you record",
    consentP1:
      "This study collects teachers’ translations of public-service sentences. Recording starts only when you press Start after a countdown. Audio is not collected.",
    consentP2:
      "Your hands, face, head and body may identify you. Contributor codes do not make videos anonymous. Facial expressions are signing features; the application does not infer emotions.",
    consentP3:
      "Authorised researchers can access recordings. When Google Drive is enabled, videos are stored privately in the research owner’s Google account. Future avatar use and public sharing are optional.",
    consentP4:
      "You can request withdrawal below. It blocks access and deletes stored recordings and annotations. Previously downloaded copies cannot be remotely erased; researchers must manage those copies and backup deletions separately.",
    latestConsentNotice: (date: string, status: string, version: string) =>
      `Latest consent: ${date} · ${status} · version ${version}`,
    statusWithdrawn: "Withdrawn",
    statusRecorded: "Recorded",
    permitRecording: "I permit video recording.",
    permitResearch: "I permit research analysis of my recordings.",
    permitAvatar: "I permit future avatar development using my recordings.",
    permitPublic: "I permit public sharing of my recordings. Optional; disabled by default.",
    saveConsentBtn: "Save my consent choices",
    consentSavedNotice:
      "Consent preferences recorded. Start a new recording session to use them.",
    withdrawSectionTitle: "Withdraw & delete",
    withdrawDesc:
      "Inspect affected records before confirming deletion. This action removes research videos and annotations.",
    identifyAffectedBtn: "Identify affected records",
    affectedCountNotice: (takes: number, annotations: number) =>
      `${takes} take(s) and ${annotations} annotation(s) are affected.`,
    typeWithdrawConfirm: "Type WITHDRAW AND DELETE to confirm",
    withdrawDeleteBtn: "Withdraw and delete",
    withdrawSuccessNotice: (deleted: number, pending: number) =>
      `Access blocked. ${deleted} files deleted; ${pending} deletions pending. Retry if any remain.`,

    // Recorder Studio
    recorderEyebrow: "TEACHER WORKSPACE",
    recorderTitle: "Record a translation",
    recorderDesc: "Read the sentence, sign its meaning, then review your take.",
    consentFirstTitle: "Consent comes first",
    consentFirstDesc:
      "Read the explanation and choose your permissions before opening the camera or recording.",
    reviewConsentBtn: "Review consent",
    noSentencesAssignedTitle: "No sentences assigned yet",
    noSentencesAssignedDesc:
      "Your teacher account is ready. An administrator must assign a prompt batch before recording can begin.",
    assignedBatch: "Assigned batch",
    selectBatch: "Select a batch",
    serviceDomain: "Service domain",
    allAssignedDomains: "All assigned domains",
    videosUploadedForBatch: (count: number) =>
      `${count} video(s) uploaded for this batch`,
    completeCollectionBtn: "Complete collection",
    collectionCompletedTitle: "Collection completed",
    collectionCompletedDesc:
      "Your uploaded videos are stored privately for administrator review.",
    startAnotherCollectionBtn: "Start another collection",
    pilotDraftNotice:
      "Draft pilot examples. These sentences have not been validated by researchers or sign-language reviewers.",
    cameraFramingTitle: "Camera & framing",
    audioOff: "Audio off",
    cameraFramingDesc:
      "Keep both hands, fingers, face, head and upper body visible. Use a stable camera and sufficient light. Framing and lighting are checked by you, not automatically.",
    previewCameraOptional: "Preview camera (optional)",
    restartCamera: "Restart camera",
    defaultCamera: "Default camera",
    mirrorPreviewOnly: "Mirror preview only",
    savedRecordingNotFlipped:
      "The saved recording is never flipped by the application. The preview mirror is a display aid only.",
    cameraPlaceholder: "Your camera preview appears here",
    previewHint:
      "Preview is optional. Start recording opens the camera if it is not already active.",
    noSentencesInBatchTitle: "No sentences in this batch",
    noSentencesInBatchDesc:
      "Please ask the administrator to assign prompts to this batch.",

    // Prompt presentation
    uploadedCount: "uploaded",
    translateInstruction:
      "Translate this sentence. Do not answer its question. Take time to read before starting.",
    primaryTamil: "Tamil (தமிழ்)",
    primarySinhala: "Sinhala (සිංහල)",
    primaryEnglish: "English",
    statusCountdown: (count: number) => `Starting in ${count}…`,
    statusRecording: (elapsed: number) => `● Recording · ${elapsed}s`,
    statusUploading: (progress: number) =>
      `Uploading ${progress}% · waiting for server confirmation`,
    statusSaved: "✓ Upload confirmed and saved",
    statusReview: "Review the actual recording",
    statusReady: "Ready when you are",
    maxDurationNotice:
      "Maximum upload duration is 10 minutes. Stop before that limit.",
    startRecordingBtn: "Start recording · 3-second countdown",
    cancelCountdownBtn: "Cancel countdown",
    stopRecordingBtn: "Stop recording",
    retakeVideoBtn: "Retake video",
    uploadVideoBtn: "Upload video and continue →",
    prevSentenceBtn: "Previous sentence",
    nextSentenceBtn: "Next sentence →",
    actualRecordedTake: "Actual recorded take",
    takeLinkedNote:
      "The uploaded video remains linked to this sentence. The research administrator can review it later.",
    serverConfirmedNotice: "Server confirmed: video saved with its sentence.",
    collectionCompletedNotification:
      "Collection completed. Your uploaded videos are stored for administrator review.",
    signThisSentence: "Sign this sentence:",
    framingReminder: "Keep both hands, fingers, face, head, and upper body visible in frame.",
    reviewTitle: "Review your recorded sign video",
    reviewSubtext: "Watch your signing video below. If it is accurate, click Upload & Next Sentence. If you want to improve it, click Re-record Video.",
    uploadAndNextBtn: "✓ Looks Good — Upload & Next Sentence →",
    rerecordBtn: "↺ Not Good — Re-record Video",
    quickConsentBtn: "✓ Agree & Start Recording",
    quickConsentTitle: "Recording consent agreement",
    quickConsentDesc: "To record sign language translations for research, please confirm that you agree to recording. No real names are stored.",
    allSentencesCompleted: "🎉 All sentences completed! Excellent work.",
    sentenceCount: (current: number, total: number) => `Sentence ${current} of ${total}`,
    uploadProgressNotice: (progress: number) => `Uploading video take (${progress}%)…`,
    takeDiscardedNotice: "Take discarded. Camera is ready to re-record.",

    // Annotation Form
    annotationTitle: "Translation & signing annotations",
    varietyLabel: "Sign language / regional variety · required",
    varietyPlaceholder:
      "e.g., Sri Lankan Sign Language (Northern/Jaffna variety)",
    variantLabel: "Observed variant",
    checkTranslates:
      "This video translates the displayed sentence, rather than answering it.",
    checkComplete: "The translation is complete.",
    checkHandsVisible: "Both hands and fingers remain visible.",
    checkFaceVisible: "The face remains visible.",
    framingIssuesLabel: "Framing / visibility issues",
    nonmanualFeaturesLabel: "Relevant facial, head and body features",
    meaningNotesLabel: "Meaning / translation notes",
    optionalSegmentsLabel: 'Optional segments: [{"start":0,"end":2,"note":"…"}]',
    decisionLabel: "Decision",
    approveOption: "Approve this translation",
    needsReviewOption: "Needs review",
    rejectOption: "Reject this take",
    saveReviewApprovalBtn: "Save review / approval",
    saving: "Saving…",
    reviewRecordedNotice: "Review recorded.",

    // My Recordings Page
    myRecordingsEyebrow: "YOUR TAKE HISTORY",
    myRecordingsTitle: "Review recordings",
    myRecordingsDesc:
      "Selected takes, original prompt versions and human review decisions stay linked.",
    filterDomain: "Domain",
    allDomains: "All domains",
    filterBatch: "Batch",
    allBatches: "All batches",
    filterStatus: "Review status",
    allStatuses: "All statuses",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusPending: "Pending",
    statusNeedsReview: "Needs review",
    selectedTakeBadge: "Selected take",
    otherTakeBadge: "Other take",
    collectionCompletedBadge: "collection completed",
    collectionInProgressBadge: "collection in progress",
    teacherReviewLabel: "Teacher:",
    researchReviewLabel: "Research:",
    noRecordingsMatch: "No recordings match these filters.",
    savedStreamNote: "Saved stream · no preview mirroring",
    videoUnavailable: "Video unavailable:",

    // Domains
    domainHospital: "Hospital reception",
    domainTransport: "Transport",
    domainBank: "Bank counters",
  },
  ta: {
    // Header & Workspace
    headerNote: "ஆராய்ச்சி வீடியோ பணியிடம்",
    logOut: "வெளியேறு",
    workspace: "பணியிடம்",
    humanReviewed: "மனிதரால் மதிப்பாய்வு செய்யப்பட்ட தரவு",
    noAutomatedSigning: "தானியங்கி சைகை மதிப்பீடு இல்லை",

    // Navigation for Teacher
    navRecord: "வாக்கியங்களைப் பதிவு செய்க",
    navReview: "எனது பதிவுகள்",
    navConsent: "சம்மதம் மற்றும் விலகல்",

    // Login / Register Page
    brandSubtitle: "சைகை மொழி ஆராய்ச்சி வீடியோ சேகரிப்பு",
    brandDesc:
      "இந்த ஆராய்ச்சி தளம் பொது சேவை வாக்கியங்களின் சைகை மொழி மொழிபெயர்ப்புகளை சேகரிக்கிறது. ஆசிரியர்கள் ஒரு வாக்கியத்தைப் பார்த்து, அதன் பொருளை சைகை மொழியில் பதிவு செய்து, ஆராய்ச்சி குழுவிற்கு பதிவேற்றுகின்றனர்.",
    scopeText: "மருத்துவமனை வரவேற்பு · போக்குவரத்து · வங்கி கவுண்டர்கள்",
    howItWorksTitle: "சேகரிப்பு எவ்வாறு செயல்படுகிறது",
    step1: "திரையில் காட்டப்படும் வாக்கியத்தைப் படியுங்கள்.",
    step2: "ஆடியோ இல்லாமல், அதன் பொருளை சைகை மொழியில் பதிவு செய்யுங்கள்.",
    step3: "வீடியோவைப் பதிவேற்றி அடுத்த வாக்கியத்திற்குச் செல்லுங்கள்.",
    step4: "தயாரானதும் சேகரிப்பை நிறைவு செய்யுங்கள்.",
    loginNotice:
      "வீடியோக்கள் தனிப்பட்டவை. நிர்வாகிகள் பதிவுகளை மதிப்பாய்வு செய்து, சம்மதம் உள்ள வீடியோக்களை அவற்றின் உரை டிரான்ஸ்கிரிப்டுகளுடன் பதிவிறக்கலாம். தானியங்கி மொழிபெயர்ப்போ அல்லது உணர்ச்சி கணிப்போ செய்யப்படாது.",
    welcomeBack: "மீண்டும் வருக",
    createTeacherAccount: "ஆசிரியர் கணக்கை உருவாக்கவும்",
    loginInstructions:
      "உங்கள் பங்களிப்பாளர் குறியீட்டைக் கொண்டு உள்நுழையவும். ஆசிரியர்கள் இங்கே புதிய கணக்கைப் பதிவு செய்யலாம்; நிர்வாகி வாக்கியங்களை ஒதுக்குவார்.",
    registerInstructions:
      "பங்களிப்பாளர் குறியீடு மற்றும் குறைந்தது 12 எழுத்துக்களைக் கொண்ட கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும். பதிவு செய்வதற்கு முன் நிர்வாகி வாக்கியங்களை ஒதுக்க வேண்டும்.",
    contributorCodeLabel: "பங்களிப்பாளர் குறியீடு",
    passwordLabel: "கடவுச்சொல்",
    loginBtn: "பாதுகாப்பாக உள்நுழைக →",
    registerBtn: "பதிவு செய்து தொடரவும்",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளது",
    registerAsTeacher: "ஆசிரியராகப் பதிவு செய்யவும்",
    accessPrivateNotice: "அணுகல் தனிப்பட்டது. வீடியோக்கள் மூலம் பங்களிப்பாளர்கள் அடையாளம் காணப்படலாம்.",

    // Consent Page
    consentEyebrow: "உங்கள் அனுமதிகள் · பதிப்பு 1.0",
    consentTitle: "தகவலறிந்த சம்மதம்",
    consentDesc: "உங்கள் சைகை மொழி பதிவுகள் எவ்வாறு பயன்படுத்தப்படலாம் என்பதைத் தனித்தனியாகத் தேர்வுசெய்யவும்.",
    beforeYouRecord: "நீங்கள் பதிவு செய்வதற்கு முன்",
    consentP1:
      "இந்த ஆய்வு பொது சேவை வாக்கியங்களின் ஆசிரியர்களின் சைகை மொழிபெயர்ப்புகளை சேகரிக்கிறது. கவுண்ட்டவுனுக்குப் பிறகு நீங்கள் Start பொத்தானை அழுத்தும்போது மட்டுமே பதிவு தொடங்கும். ஆடியோ சேகரிக்கப்படாது.",
    consentP2:
      "உங்கள் கைகள், முகம், தலை மற்றும் உடல் மூலம் நீங்கள் அடையாளம் காணப்படலாம். பங்களிப்பாளர் குறியீடுகள் வீடியோக்களை அநாமதேயமாக்காது. முகபாவனைகள் சைகை மொழியின் இயல்பான அம்சங்களாகும்; பயன்பாடு உணர்ச்சிகளை ஊகிக்காது.",
    consentP3:
      "அங்கீகரிக்கப்பட்ட ஆராய்ச்சியாளர்கள் பதிவுகளை அணுகலாம். Google Drive இயக்கப்பட்டிருக்கும்போது, வீடியோக்கள் ஆராய்ச்சி உரிமையாளரின் Google கணக்கில் தனிப்பட்ட முறையில் சேமிக்கப்படும். அவதார் பயன்பாடு மற்றும் பொது பகிர்வு விருப்பத்திற்குரியது.",
    consentP4:
      "நீங்கள் கீழே விலகலைக் கோரலாம். இது அணுகலைத் தடுத்து, சேமிக்கப்பட்ட பதிவுகள் மற்றும் குறிப்புகளை நீக்குகிறது. ஏற்கனவே பதிவிறக்கம் செய்யப்பட்ட பிரதிகளை தொலைவிலிருந்து அழிக்க முடியாது; ஆராய்ச்சியாளர்கள் அந்த பிரதிகளை தனித்தனியாக நிர்வகிக்க வேண்டும்.",
    latestConsentNotice: (date: string, status: string, version: string) =>
      `சமீபத்திய சம்மதம்: ${date} · ${status} · பதிப்பு ${version}`,
    statusWithdrawn: "விலகப்பட்டது",
    statusRecorded: "பதிவு செய்யப்பட்டது",
    permitRecording: "வீடியோ பதிவுக்கு நான் சம்மதிக்கிறேன்.",
    permitResearch: "எனது பதிவுகளின் ஆராய்ச்சி ஆய்வுக்கு நான் சம்மதிக்கிறேன்.",
    permitAvatar: "எனது பதிவுகளைப் பயன்படுத்தி எதிர்கால அவதார் உருவாக்கத்திற்கு நான் சம்மதிக்கிறேன்.",
    permitPublic: "எனது பதிவுகளை பொதுவெளியில் பகிர சம்மதிக்கிறேன் (விருப்பத்திற்குரியது).",
    saveConsentBtn: "எனது சம்மத விருப்பங்களைச் சேமிக்கவும்",
    consentSavedNotice:
      "சம்மத விருப்பங்கள் பதிவு செய்யப்பட்டன. அவற்றைப் பயன்படுத்த புதிய அமர்வைத் தொடங்கவும்.",
    withdrawSectionTitle: "விலகி நீக்குதல்",
    withdrawDesc:
      "நீக்குதலை உறுதிப்படுத்துவதற்கு முன் பாதிக்கப்பட்ட பதிவுகளைச் சரிபார்க்கவும். இந்த நடவடிக்கை ஆராய்ச்சி வீடியோக்களையும் குறிப்புகளையும் நிரந்தரமாக நீக்கும்.",
    identifyAffectedBtn: "பாதிக்கப்பட்ட பதிவுகளைக் கண்டறிக",
    affectedCountNotice: (takes: number, annotations: number) =>
      `${takes} பதிவு(கள்) மற்றும் ${annotations} குறிப்பு(கள்) பாதிக்கப்படும்.`,
    typeWithdrawConfirm: "உறுதிப்படுத்த WITHDRAW AND DELETE என தட்டச்சு செய்க",
    withdrawDeleteBtn: "விலகி நீக்குக",
    withdrawSuccessNotice: (deleted: number, pending: number) =>
      `அணுகல் தடுக்கப்பட்டது. ${deleted} கோப்புகள் நீக்கப்பட்டன; ${pending} நீக்கங்கள் நிலுவையில் உள்ளன.`,

    // Recorder Studio
    recorderEyebrow: "ஆசிரியர் பணியிடம்",
    recorderTitle: "மொழிபெயர்ப்பைப் பதிவு செய்க",
    recorderDesc: "வாக்கியத்தைப் படியுங்கள், அதன் பொருளை சைகை செய்யுங்கள், பின் சரிபார்க்கவும்.",
    consentFirstTitle: "சம்மதம் முதலில் தேவை",
    consentFirstDesc:
      "கேமராவைத் திறப்பதற்கு அல்லது பதிவு செய்வதற்கு முன் விளக்கத்தைப் படித்து உங்கள் அனுமதிகளைத் தேர்வுசெய்யவும்.",
    reviewConsentBtn: "சம்மதத்தை மதிப்பாய்வு செய்க",
    noSentencesAssignedTitle: "இன்னும் வாக்கியங்கள் ஒதுக்கப்படவில்லை",
    noSentencesAssignedDesc:
      "உங்கள் ஆசிரியர் கணக்கு தயாராக உள்ளது. பதிவு தொடங்குவதற்கு முன் நிர்வாகி ஒரு தொகுதி வாக்கியங்களை ஒதுக்க வேண்டும்.",
    assignedBatch: "ஒதுக்கப்பட்ட தொகுதி",
    selectBatch: "தொகுதியைத் தேர்ந்தெடுக்கவும்",
    serviceDomain: "சேவைத் துறை",
    allAssignedDomains: "அனைத்து ஒதுக்கப்பட்ட துறைகளும்",
    videosUploadedForBatch: (count: number) =>
      `இந்தத் தொகுதிக்கு ${count} வீடியோ(க்கள்) பதிவேற்றப்பட்டது`,
    completeCollectionBtn: "சேகரிப்பை நிறைவு செய்க",
    collectionCompletedTitle: "சேகரிப்பு நிறைவுற்றது",
    collectionCompletedDesc:
      "பதிவேற்றப்பட்ட வீடியோக்கள் நிர்வாகியின் மதிப்பாய்வுக்காகப் பாதுகாப்பாகச் சேமிக்கப்பட்டுள்ளன.",
    startAnotherCollectionBtn: "மற்றொரு சேகரிப்பைத் தொடங்கவும்",
    pilotDraftNotice:
      "வரைவு முன்னோடி மாதிரிகள். இந்த வாக்கியங்கள் ஆராய்ச்சியாளர்களால் இன்னும் முழுமையாக சரிபார்க்கப்படவில்லை.",
    cameraFramingTitle: "கேமரா மற்றும் கட்டமைப்பு",
    audioOff: "ஆடியோ முடக்கப்பட்டுள்ளது",
    cameraFramingDesc:
      "இரு கைகள், விரல்கள், முகம், தலை மற்றும் உடலின் மேல் பகுதி தெளிவாகத் தெரியுமாறு பார்த்துக் கொள்ளுங்கள். போதுமான வெளிச்சத்தைப் பயன்படுத்துங்கள்.",
    previewCameraOptional: "கேமரா முன்னோட்டம் (விருப்பத்திற்குரியது)",
    restartCamera: "கேமராவை மீண்டும் தொடங்கவும்",
    defaultCamera: "இயல்புநிலை கேமரா",
    mirrorPreviewOnly: "முன்னோட்டத்தை மட்டும் பிரதிபலிக்கவும் (Mirror)",
    savedRecordingNotFlipped:
      "சேமிக்கப்பட்ட பதிவு பயன்பாட்டினால் தலைகீழாக மாற்றப்படாது. முன்னோட்ட கண்ணாடி திரைக் காட்சிக்கு மட்டுமே.",
    cameraPlaceholder: "உங்கள் கேமரா முன்னோட்டம் இங்கே தோன்றும்",
    previewHint:
      "முன்னோட்டம் விருப்பத்திற்குரியது. பதிவு தொடங்கும் போது கேமரா தானாக திறக்கப்படும்.",
    noSentencesInBatchTitle: "இந்தத் தொகுதியில் வாக்கியங்கள் இல்லை",
    noSentencesInBatchDesc:
      "தயவுசெய்து இந்தத் தொகுதிக்கு வாக்கியங்களை ஒதுக்க நிர்வாகியிடம் கேட்கவும்.",

    // Prompt presentation
    uploadedCount: "பதிவேற்றப்பட்டது",
    translateInstruction:
      "இந்த வாக்கியத்தை மொழிபெயர்க்கவும். கேள்விக்கு பதிலளிக்க வேண்டாம். தொடங்குவதற்கு முன் வாசித்து புரிந்து கொள்ளுங்கள்.",
    primaryTamil: "தமிழ் (Tamil)",
    primarySinhala: "சிங்களம் (Sinhala)",
    primaryEnglish: "ஆங்கிலம் (English)",
    statusCountdown: (count: number) => `${count} வினாடிகளில் தொடங்கும்…`,
    statusRecording: (elapsed: number) => `● பதிவாகிறது · ${elapsed} வினாடிகள்`,
    statusUploading: (progress: number) =>
      `பதிவேற்றப்படுகிறது ${progress}% · சேவையக உறுதிப்படுத்தலுக்குக் காத்திருக்கிறது`,
    statusSaved: "✓ பதிவேற்றம் உறுதி செய்யப்பட்டு சேமிக்கப்பட்டது",
    statusReview: "பதிவு செய்யப்பட்ட வீடியோவை மதிப்பாய்வு செய்க",
    statusReady: "நீங்கள் தயாரானதும் தொடங்கலாம்",
    maxDurationNotice:
      "அதிகபட்ச கால அளவு 10 நிமிடங்கள். அதற்கு முன் நிறுத்தவும்.",
    startRecordingBtn: "பதிவைத் தொடங்குக · 3-வினாடி கவுண்ட்டவுன்",
    cancelCountdownBtn: "கவுண்ட்டவுனை ரத்து செய்க",
    stopRecordingBtn: "பதிவை நிறுத்துக",
    retakeVideoBtn: "மீண்டும் பதிவு செய்க",
    uploadVideoBtn: "வீடியோவைப் பதிவேற்றி தொடரவும் →",
    prevSentenceBtn: "முந்தைய வாக்கியம்",
    nextSentenceBtn: "அடுத்த வாக்கியம் →",
    actualRecordedTake: "பதிவு செய்யப்பட்ட வீடியோ",
    takeLinkedNote:
      "பதிவேற்றப்பட்ட வீடியோ இந்த வாக்கியத்துடன் இணைக்கப்பட்டிருக்கும். நிர்வாகி பின்னர் இதை மதிப்பாய்வு செய்யலாம்.",
    serverConfirmedNotice: "சேவையகம் உறுதிப்படுத்தியது: வீடியோ வாக்கியத்துடன் சேமிக்கப்பட்டது.",
    collectionCompletedNotification:
      "சேகரிப்பு நிறைவுற்றது. பதிவேற்றப்பட்ட வீடியோக்கள் நிர்வாகி மதிப்பாய்வுக்குச் சேமிக்கப்பட்டுள்ளன.",
    signThisSentence: "இந்த வாக்கியத்தை சைகை மொழியில் செய்க:",
    framingReminder: "இரு கைகள், விரல்கள், முகம், தலை மற்றும் உடலின் மேல் பகுதி தெளிவாகத் தெரியுமாறு பார்த்துக் கொள்ளுங்கள்.",
    reviewTitle: "பதிவு செய்யப்பட்ட சைகை வீடியோவை மதிப்பாய்வு செய்யவும்",
    reviewSubtext: "உங்கள் சைகை வீடியோவை கீழே சரிபார்க்கவும். சரியாக இருந்தால், 'சரியாக உள்ளது — பதிவேற்றி அடுத்த வாக்கியத்திற்குச் செல்க' என்பதை அழுத்தவும். இல்லையெனில், 'மீண்டும் பதிவு செய்க' என்பதை அழுத்தவும்.",
    uploadAndNextBtn: "✓ சரியாக உள்ளது — பதிவேற்றி அடுத்த வாக்கியத்திற்குச் செல்க →",
    rerecordBtn: "↺ சரியாக இல்லை — மீண்டும் பதிவு செய்க",
    quickConsentBtn: "✓ பதிவுக்குச் சம்மதித்துத் தொடங்கவும்",
    quickConsentTitle: "பதிவு சம்மத ஒப்பந்தம்",
    quickConsentDesc: "ஆராய்ச்சிக்காக சைகை மொழிபெயர்ப்புகளைப் பதிவு செய்ய உங்கள் சம்மதத்தை உறுதிப்படுத்தவும். உண்மையான பெயர்கள் சேமிக்கப்படாது.",
    allSentencesCompleted: "🎉 அனைத்து வாக்கியங்களும் நிறைவடைந்தன! சிறந்த பணி.",
    sentenceCount: (current: number, total: number) => `வாக்கியம் ${current} / ${total}`,
    uploadProgressNotice: (progress: number) => `வீடியோ பதிவேற்றப்படுகிறது (${progress}%)…`,
    takeDiscardedNotice: "முந்தைய பதிவு நீக்கப்பட்டது. மீண்டும் பதிவு செய்ய கேமரா தயாராக உள்ளது.",

    // Annotation Form
    annotationTitle: "மொழிபெயர்ப்பு மற்றும் சைகைக் குறிப்புகள்",
    varietyLabel: "சைகை மொழி / பிராந்திய வகை · கட்டாயமானது",
    varietyPlaceholder:
      "எ.கா: இலங்கை சைகை மொழி (வடக்கு/யாழ்ப்பாண வகை)",
    variantLabel: "அவதானிக்கப்பட்ட மாறுபாடு",
    checkTranslates:
      "இந்த வீடியோ வாக்கியத்திற்குப் பதிலளிக்காமல், அதன் பொருளை மொழிபெயர்க்கிறது.",
    checkComplete: "மொழிபெயர்ப்பு முழுமையானது.",
    checkHandsVisible: "இரு கைகளும் விரல்களும் தெளிவாகத் தெரிகின்றன.",
    checkFaceVisible: "முகம் தெளிவாகத் தெரிகிறது.",
    framingIssuesLabel: "கட்டமைப்பு / பார்வைச் சிக்கல்கள்",
    nonmanualFeaturesLabel: "தொடர்புடைய முகம், தலை மற்றும் உடல் அசைவுகள்",
    meaningNotesLabel: "பொருள் / மொழிபெயர்ப்புக் குறிப்புகள்",
    optionalSegmentsLabel: 'விருப்பப் பிரிவுகள்: [{"start":0,"end":2,"note":"…"}]',
    decisionLabel: "முடிவு",
    approveOption: "இந்த மொழிபெயர்ப்பை அங்கீகரிக்கவும்",
    needsReviewOption: "மறுஆய்வு தேவை",
    rejectOption: "இப்பதிவை நிராகரிக்கவும்",
    saveReviewApprovalBtn: "மதிப்பாய்வு / அங்கீகாரத்தைச் சேமிக்கவும்",
    saving: "சேமிக்கப்படுகிறது…",
    reviewRecordedNotice: "மதிப்பாய்வு பதிவு செய்யப்பட்டது.",

    // My Recordings Page
    myRecordingsEyebrow: "உங்கள் பதிவு வரலாறு",
    myRecordingsTitle: "பதிவுகளை மதிப்பாய்வு செய்க",
    myRecordingsDesc:
      "தேர்ந்தெடுக்கப்பட்ட பதிவுகள், மூல வாக்கியங்கள் மற்றும் மதிப்பாய்வு முடிவுகள் இணைக்கப்பட்டிருக்கும்.",
    filterDomain: "துறை",
    allDomains: "அனைத்து துறைகளும்",
    filterBatch: "தொகுதி",
    allBatches: "அனைத்து தொகுதிகளும்",
    filterStatus: "மதிப்பாய்வு நிலை",
    allStatuses: "அனைத்து நிலைகளும்",
    statusApproved: "அங்கீகரிக்கப்பட்டது",
    statusRejected: "நிராகரிக்கப்பட்டது",
    statusPending: "நிலுவையில் உள்ளது",
    statusNeedsReview: "மறுஆய்வு தேவை",
    selectedTakeBadge: "தேர்ந்தெடுக்கப்பட்ட பதிவு",
    otherTakeBadge: "மற்றொரு பதிவு",
    collectionCompletedBadge: "சேகரிப்பு நிறைவுற்றது",
    collectionInProgressBadge: "சேகரிப்பு நடப்பில் உள்ளது",
    teacherReviewLabel: "ஆசிரியர்:",
    researchReviewLabel: "ஆராய்ச்சி:",
    noRecordingsMatch: "இந்த வடிப்பான்களுக்குப் பொருந்தும் பதிவுகள் எதுவும் இல்லை.",
    savedStreamNote: "சேமிக்கப்பட்ட வீடியோ · திரைக் கண்ணாடி பிரதிபலிப்பு இல்லை",
    videoUnavailable: "வீடியோ கிடைக்கவில்லை:",

    // Domains
    domainHospital: "மருத்துவமனை வரவேற்பு",
    domainTransport: "போக்குவரத்து",
    domainBank: "வங்கி கவுண்டர்கள்",
  },
  si: {
    // Header & Workspace
    headerNote: "පර්යේෂණ වීඩියෝ වැඩබිම",
    logOut: "නික්මෙන්න",
    workspace: "වැඩබිම",
    humanReviewed: "මානව සමාලෝචිත දත්ත",
    noAutomatedSigning: "ස්වයංක්‍රීය සංඥා ඇගයීමක් නොමැත",

    // Navigation for Teacher
    navRecord: "වාක්‍ය පටිගත කරන්න",
    navReview: "මගේ පටිගත කිරීම්",
    navConsent: "කැමැත්ත සහ ඉවත් කර ගැනීම",

    // Login / Register Page
    brandSubtitle: "සංඥා භාෂා පර්යේෂණ වීඩියෝ එකතුව",
    brandDesc:
      "මෙම පර්යේෂණ වේදිකාව මඟින් පොදු සේවා වාක්‍යවල සංඥා භාෂා පරිවර්තන එකතු කරයි. ගුරුවරුන් එක් වාක්‍යයක් දැක, එහි තේරුම සංඥාවෙන් පටිගත කර, පර්යේෂණ කණ්ඩායම වෙත වීඩියෝව උඩුගත කරනු ලබයි.",
    scopeText: "රෝහල් පිළිගැනීම · ප්‍රවාහනය · බැංකු කවුන්ටර",
    howItWorksTitle: "දත්ත එකතු කිරීම සිදු වන ආකාරය",
    step1: "තිරයේ පෙන්වා ඇති වාක්‍යය කියවන්න.",
    step2: "ශබ්දය රහිතව, එහි අර්ථය සංඥා භාෂාවෙන් පටිගත කරන්න.",
    step3: "වීඩියෝව උඩුගත කර ඊළඟ වාක්‍යය වෙත යන්න.",
    step4: "ඔබ සූදානම් වූ විට එකතුව සම්පූර්ණ කරන්න.",
    loginNotice:
      "වීඩියෝ පෞද්ගලිකයි. පරිපාලකයින්ට පටිගත කිරීම් සමාලෝචනය කළ හැකි අතර කැමැත්ත ලබා දී ඇති වීඩියෝ පමණක් බාගත කළ හැකිය. ස්වයංක්‍රීය පරිවර්තන හෝ හැඟීම් නිගමනය කිරීම් සිදු නොකෙරේ.",
    welcomeBack: "නැවත සාදරයෙන් පිළිගනිමු",
    createTeacherAccount: "ගුරු ගිණුමක් සාදන්න",
    loginInstructions:
      "ඔබගේ දායකත්ව කේතය (Contributor code) භාවිතයෙන් ඇතුළු වන්න. ගුරුවරුන්ට මෙහි නව ගිණුමක් ලියාපදිංචි කළ හැක; පරිපාලකයෙකු විසින් වාක්‍ය පවරනු ලැබේ.",
    registerInstructions:
      "දායකත්ව කේතයක් සහ අවම වශයෙන් අක්ෂර 12 ක මුරපදයක් තෝරන්න. පටිගත කිරීමට පෙර පරිපාලකයෙකු වාක්‍ය පැවරිය යුතුය.",
    contributorCodeLabel: "දායකත්ව කේතය",
    passwordLabel: "මුරපදය",
    loginBtn: "ආරක්ෂිතව ඇතුළු වන්න →",
    registerBtn: "ලියාපදිංචි වී ඉදිරියට යන්න",
    alreadyHaveAccount: "මට දැනටමත් ගිණුමක් ඇත",
    registerAsTeacher: "ගුරුවරයෙකු ලෙස ලියාපදිංචි වන්න",
    accessPrivateNotice: "ප්‍රවේශය පුද්ගලිකයි. වීඩියෝ මඟින් දායකයින් හඳුනාගත හැක.",

    // Consent Page
    consentEyebrow: "ඔබගේ අවසරයන් · අනුවාදය 1.0",
    consentTitle: "දැනුවත් කැමැත්ත",
    consentDesc: "ඔබගේ සංඥා පටිගත කිරීම් භාවිත කළ හැකි ආකාරය වෙන වෙනම තෝරන්න.",
    beforeYouRecord: "පටිගත කිරීමට පෙර",
    consentP1:
      "මෙම අධ්‍යයනය මඟින් පොදු සේවා වාක්‍යවල ගුරු සංඥා පරිවර්තන එකතු කරයි. පටිගත කිරීම ආරම්භ වන්නේ ගණන් කිරීමෙන් පසු ඔබ Start එබූ විට පමණි. ශබ්දය එකතු නොකෙරේ.",
    consentP2:
      "ඔබගේ දෑත්, මුහුණ, හිස සහ ශරීරය මඟින් ඔබව හඳුනාගත හැක. දායකත්ව කේත මඟින් වීඩියෝ නිර්නාමික නොවේ. මුහුණේ ඉරියව් සංඥා කිරීමේ ලක්ෂණ වේ; පද්ධතිය හැඟීම් නිගමනය නොකරයි.",
    consentP3:
      "බලයලත් පර්යේෂකයන්ට පටිගත කිරීම් වෙත ප්‍රවේශ විය හැක. Google Drive ක්‍රියාත්මක කර ඇති විට, පර්යේෂණ හිමිකරුගේ ගිණුමේ පුද්ගලිකව වීඩියෝ ගබඩා වේ. අනාගත ඇවටාර් භාවිතය සහ ප්‍රසිද්ධ බෙදාගැනීම විකල්ප වේ.",
    consentP4:
      "ඔබට පහතින් ඉවත් වීම ඉල්ලා සිටිය හැක. එය ප්‍රවේශය අවහිර කර ගබඩා කර ඇති පටිගත කිරීම් සහ සටහන් මකා දමයි. මීට පෙර බාගත කළ පිටපත් දුරස්ථව මකා දැමිය නොහැක; පර්යේෂකයින් එම පිටපත් වෙනම කළමනාකරණය කළ යුතුය.",
    latestConsentNotice: (date: string, status: string, version: string) =>
      `නවතම කැමැත්ත: ${date} · ${status} · අනුවාදය ${version}`,
    statusWithdrawn: "ඉවත් කර ගන්නා ලදි",
    statusRecorded: "වාර්තාගතයි",
    permitRecording: "මම වීඩියෝ පටිගත කිරීමට අවසර දෙමි.",
    permitResearch: "මගේ පටිගත කිරීම් පර්යේෂණ විශ්ලේෂණය සඳහා භාවිත කිරීමට මම අවසර දෙමි.",
    permitAvatar: "මගේ පටිගත කිරීම් භාවිතයෙන් අනාගත ඇවටාර් සංවර්ධනයට මම අවසර දෙමි.",
    permitPublic: "මගේ පටිගත කිරීම් ප්‍රසිද්ධියේ බෙදා ගැනීමට අවසර දෙමි (විකල්පයි; පෙරනිමියෙන් අක්‍රියයි).",
    saveConsentBtn: "මගේ කැමැත්ත තේරීම් සුරකින්න",
    consentSavedNotice:
      "කැමැත්ත තේරීම් සුරකින ලදි. ඒවා භාවිත කිරීමට නව පටිගත කිරීමේ සැසියක් අරඹන්න.",
    withdrawSectionTitle: "ඉවත් වී මකා දැමීම",
    withdrawDesc:
      "මකා දැමීම තහවුරු කිරීමට පෙර බලපෑමට ලක්වන වාර්තා පරීක්ෂා කරන්න. මෙම ක්‍රියාව මඟින් වීඩියෝ සහ සටහන් ඉවත් කෙරේ.",
    identifyAffectedBtn: "බලපෑමට ලක්වන වාර්තා හඳුනා ගන්න",
    affectedCountNotice: (takes: number, annotations: number) =>
      `පටිගත කිරීම් ${takes}ක් සහ සටහන් ${annotations}ක් බලපෑමට ලක්වේ.`,
    typeWithdrawConfirm: "තහවුරු කිරීම සඳහා WITHDRAW AND DELETE ලෙස ටයිප් කරන්න",
    withdrawDeleteBtn: "ඉවත් වී මකා දමන්න",
    withdrawSuccessNotice: (deleted: number, pending: number) =>
      `ප්‍රවේශය අවහිර කරන ලදි. ලිපිගොනු ${deleted}ක් මකා දමන ලදි; මකා දැමීම් ${pending}ක් අපේක්ෂිතයි.`,

    // Recorder Studio
    recorderEyebrow: "ගුරු වැඩබිම",
    recorderTitle: "පරිවර්තනයක් පටිගත කරන්න",
    recorderDesc: "වාක්‍යය කියවා, එහි තේරුම සංඥාවෙන් දක්වා, ඔබගේ පටිගත කිරීම පරීක්ෂා කරන්න.",
    consentFirstTitle: "පළමුව කැමැත්ත අවශ්‍යයි",
    consentFirstDesc:
      "කැමරාව විවෘත කිරීමට හෝ පටිගත කිරීමට පෙර විස්තරය කියවා ඔබගේ අවසර ලබා දෙන්න.",
    reviewConsentBtn: "කැමැත්ත සමාලෝචනය කරන්න",
    noSentencesAssignedTitle: "තවමත් වාක්‍ය පවරා නොමැත",
    noSentencesAssignedDesc:
      "ඔබගේ ගුරු ගිණුම සූදානම්. පටිගත කිරීම ඇරඹීමට පරිපාලකයෙකු වාක්‍ය කාණ්ඩයක් පැවරිය යුතුය.",
    assignedBatch: "පවරන ලද කාණ්ඩය",
    selectBatch: "කාණ්ඩයක් තෝරන්න",
    serviceDomain: "සේවා අංශය",
    allAssignedDomains: "සියලුම පවරන ලද අංශ",
    videosUploadedForBatch: (count: number) =>
      `මෙම කාණ්ඩය සඳහා වීඩියෝ ${count}ක් උඩුගත කර ඇත`,
    completeCollectionBtn: "එකතුව සම්පූර්ණ කරන්න",
    collectionCompletedTitle: "එකතු කිරීම සම්පූර්ණයි",
    collectionCompletedDesc:
      "ඔබ උඩුගත කළ වීඩියෝ පරිපාලක සමාලෝචනය සඳහා පුද්ගලිකව සුරැකී ඇත.",
    startAnotherCollectionBtn: "තවත් එකතුවක් අරඹන්න",
    pilotDraftNotice:
      "නියමු කෙටුම්පත් උදාහරණ. මෙම වාක්‍ය පර්යේෂකයන් විසින් තවමත් සම්පූර්ණයෙන් තහවුරු කර නොමැත.",
    cameraFramingTitle: "කැමරාව සහ රාමුගත කිරීම",
    audioOff: "ශබ්දය රහිතයි",
    cameraFramingDesc:
      "දෑත් දෙකම, ඇඟිලි, මුහුණ, හිස සහ ශරීරයේ ඉහළ කොටස පැහැදිලිව පෙනෙන සේ තබා ගන්න. ප්‍රමාණවත් ආලෝකයක් භාවිත කරන්න.",
    previewCameraOptional: "කැමරා පෙරදසුන (විකල්පයි)",
    restartCamera: "කැමරාව නැවත අරඹන්න",
    defaultCamera: "පෙරනිමි කැමරාව",
    mirrorPreviewOnly: "පෙරදසුන පමණක් මිරර් කරන්න",
    savedRecordingNotFlipped:
      "සුරකින ලද පටිගත කිරීම කිසි විටෙකත් මිරර් නොකෙරේ. පෙරදසුන බැලීම සඳහා පමණි.",
    cameraPlaceholder: "ඔබගේ කැමරා පෙරදසුන මෙහි දිස්වේ",
    previewHint:
      "පෙරදසුන විකල්ප වේ. පටිගත කිරීම ඇරඹූ විට කැමරාව ස්වයංක්‍රීයව ක්‍රියාත්මක වේ.",
    noSentencesInBatchTitle: "මෙම කාණ්ඩයේ වාක්‍ය නොමැත",
    noSentencesInBatchDesc:
      "කරුණාකර මෙම කාණ්ඩයට වාක්‍ය පවරන ලෙස පරිපාලකගෙන් ඉල්ලා සිටින්න.",

    // Prompt presentation
    uploadedCount: "උඩුගත කරන ලදි",
    translateInstruction:
      "මෙම වාක්‍යය පරිවර්තනය කරන්න. ප්‍රශ්නයට පිළිතුරු නොදෙන්න. ආරම්භ කිරීමට පෙර හොඳින් කියවන්න.",
    primaryTamil: "දෙමළ (Tamil)",
    primarySinhala: "සිංහල (Sinhala)",
    primaryEnglish: "ඉංග්‍රීසි (English)",
    statusCountdown: (count: number) => `තත්පර ${count}කින් ඇරඹේ…`,
    statusRecording: (elapsed: number) => `● පටිගත වේ · තත්පර ${elapsed}`,
    statusUploading: (progress: number) =>
      `උඩුගත කෙරේ ${progress}% · සේවාදායක තහවුරු කිරීම අපේක්ෂාවෙන්`,
    statusSaved: "✓ උඩුගත කිරීම තහවුරු කර සුරකින ලදි",
    statusReview: "පටිගත කළ වීඩියෝව පරීක්ෂා කරන්න",
    statusReady: "ඔබ සූදානම් වූ විට ආරම්භ කළ හැක",
    maxDurationNotice:
      "උපරිම කාලය මිනිත්තු 10 කි. එම සීමාවට පෙර නවත්වන්න.",
    startRecordingBtn: "පටිගත කිරීම අරඹන්න · තත්පර 3 ක ගණන් කිරීම",
    cancelCountdownBtn: "ගණන් කිරීම අවලංගු කරන්න",
    stopRecordingBtn: "පටිගත කිරීම නවත්වන්න",
    retakeVideoBtn: "නැවත පටිගත කරන්න",
    uploadVideoBtn: "වීඩියෝව උඩුගත කර ඉදිරියට යන්න →",
    prevSentenceBtn: "පෙර වාක්‍යය",
    nextSentenceBtn: "ඊළඟ වාක්‍යය →",
    actualRecordedTake: "පටිගත කළ වීඩියෝව",
    takeLinkedNote:
      "උඩුගත කළ වීඩියෝව මෙම වාක්‍යයට සම්බන්ධ වේ. පර්යේෂණ පරිපාලක හට පසුව එය සමාලෝචනය කළ හැක.",
    serverConfirmedNotice: "සේවාදායකය තහවුරු කරන ලදි: වීඩියෝව වාක්‍යය සමඟ සුරකින ලදි.",
    collectionCompletedNotification:
      "එකතු කිරීම සම්පූර්ණයි. උඩුගත කළ වීඩියෝ පරිපාලක සමාලෝචනය සඳහා සුරකින ලදි.",
    signThisSentence: "මෙම වාක්‍යය සංඥා භාෂාවෙන් දක්වන්න:",
    framingReminder: "දෑත් දෙකම, ඇඟිලි, මුහුණ, හිස සහ ශරීරයේ ඉහළ කොටස කැමරා රාමුව තුළ පැහැදිලිව තබා ගන්න.",
    reviewTitle: "පටිගත කළ සංඥා වීඩියෝව පරීක්ෂා කරන්න",
    reviewSubtext: "ඔබගේ සංඥා වීඩියෝව පහතින් නරඹන්න. එය නිවැරදි නම්, 'නිවැරදියි — උඩුගත කර ඊළඟ වාක්‍යයට යන්න' ක්ලික් කරන්න. වෙනසක් අවශ්‍ය නම්, 'නැවත පටිගත කරන්න' ක්ලික් කරන්න.",
    uploadAndNextBtn: "✓ නිවැරදියි — උඩුගත කර ඊළඟ වාක්‍යයට යන්න →",
    rerecordBtn: "↺ වැරදියි — නැවත පටිගත කරන්න",
    quickConsentBtn: "✓ පටිගත කිරීමට එකඟ වී අරඹන්න",
    quickConsentTitle: "පටිගත කිරීමේ කැමැත්ත ප්‍රකාශ කිරීම",
    quickConsentDesc: "පර්යේෂණ කටයුතු සඳහා සංඥා පරිවර්තන පටිගත කිරීමට ඔබගේ කැමැත්ත තහවුරු කරන්න. සැබෑ නම් ගබඩා නොකෙරේ.",
    allSentencesCompleted: "🎉 සියලුම වාක්‍ය සම්පූර්ණයි! විශිෂ්ට කාර්යයක්.",
    sentenceCount: (current: number, total: number) => `වාක්‍ය ${current} / ${total}`,
    uploadProgressNotice: (progress: number) => `වීඩියෝව උඩුගත කෙරේ (${progress}%)…`,
    takeDiscardedNotice: "පටිගත කිරීම ඉවත් කරන ලදි. නැවත පටිගත කිරීමට කැමරාව සූදානම්.",

    // Annotation Form
    annotationTitle: "පරිවර්තන සහ සංඥා සටහන්",
    varietyLabel: "සංඥා භාෂාව / ප්‍රාදේශීය ප්‍රභේදය · අනිවාර්යයි",
    varietyPlaceholder:
      "උදා: ශ්‍රී ලාංකික සංඥා භාෂාව (උතුරු/යාපනය ප්‍රභේදය)",
    variantLabel: "නිරීක්ෂිත ප්‍රභේදය",
    checkTranslates:
      "මෙම වීඩියෝව ප්‍රශ්නයට පිළිතුරු නොදී, වාක්‍යයේ අර්ථය පරිවර්තනය කරයි.",
    checkComplete: "පරිවර්තනය සම්පූර්ණයි.",
    checkHandsVisible: "දෑත් දෙකම සහ ඇඟිලි පැහැදිලිව පෙනේ.",
    checkFaceVisible: "මුහුණ පැහැදිලිව පෙනේ.",
    framingIssuesLabel: "රාමුගත කිරීම / දෘශ්‍යතා ගැටළු",
    nonmanualFeaturesLabel: "අදාළ මුහුණේ, හිසේ සහ ශරීරයේ ඉරියව්",
    meaningNotesLabel: "අර්ථය / පරිවර්තන සටහන්",
    optionalSegmentsLabel: 'විකල්ප ඛණ්ඩ: [{"start":0,"end":2,"note":"…"}]',
    decisionLabel: "තීරණය",
    approveOption: "මෙම පරිවර්තනය අනුමත කරන්න",
    needsReviewOption: "නැවත සමාලෝචනය අවශ්‍යයි",
    rejectOption: "මෙම පටිගත කිරීම ප්‍රතික්ෂේප කරන්න",
    saveReviewApprovalBtn: "සමාලෝචනය / අනුමැතිය සුරකින්න",
    saving: "සුරැකෙමින් පවතී…",
    reviewRecordedNotice: "සමාලෝචනය වාර්තාගත කරන ලදි.",

    // My Recordings Page
    myRecordingsEyebrow: "ඔබගේ පටිගත කිරීම් ඉතිහාසය",
    myRecordingsTitle: "පටිගත කිරීම් සමාලෝචනය කරන්න",
    myRecordingsDesc:
      "තෝරාගත් පටිගත කිරීම්, මුල් වාක්‍යයන් සහ සමාලෝචන තීරණ සම්බන්ධ වී පවතී.",
    filterDomain: "අංශය",
    allDomains: "සියලුම අංශ",
    filterBatch: "කාණ්ඩය",
    allBatches: "සියලුම කාණ්ඩ",
    filterStatus: "සමාලෝචන තත්ත්වය",
    allStatuses: "සියලුම තත්ත්වයන්",
    statusApproved: "අනුමතයි",
    statusRejected: "ප්‍රතික්ෂේපයි",
    statusPending: "අපේක්ෂිතයි",
    statusNeedsReview: "සමාලෝචනය අවශ්‍යයි",
    selectedTakeBadge: "තෝරාගත් පටිගත කිරීම",
    otherTakeBadge: "වෙනත් පටිගත කිරීම",
    collectionCompletedBadge: "එකතු කිරීම සම්පූර්ණයි",
    collectionInProgressBadge: "එකතු කිරීම ක්‍රියාත්මකයි",
    teacherReviewLabel: "ගුරුවරයා:",
    researchReviewLabel: "පර්යේෂණ:",
    noRecordingsMatch: "මෙම පෙරහන්වලට ගැලපෙන පටිගත කිරීම් නොමැත.",
    savedStreamNote: "සුරකින ලද වීඩියෝව · මිරර් කිරීමක් නොමැත",
    videoUnavailable: "වීඩියෝව නොලැබේ:",

    // Domains
    domainHospital: "රෝහල් පිළිගැනීම",
    domainTransport: "ප්‍රවාහනය",
    domainBank: "බැංකු කවුන්ටර",
  },
};
