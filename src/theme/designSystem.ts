export const AppColors = {
  light: {
    primary: '#FF9B54',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFD9C6',
    onPrimaryContainer: '#3D1C00',
    secondary: '#7A5741',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDBCA',
    onSecondaryContainer: '#2D1605',
    tertiary: '#6C5D2F',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F6DF9E',
    onTertiaryContainer: '#221B00',
    surface: '#F7F3EE',
    onSurface: '#1C1B1A',
    surfaceVariant: '#E9E3DE',
    onSurfaceVariant: '#4A4541',
    outline: '#7C7673',
    error: '#BA1A1A',
    onError: '#FFFFFF',
  },
  dark: {
    primary: '#FF9B54',
    onPrimary: '#4E2300',
    primaryContainer: '#633300',
    onPrimaryContainer: '#FFD9C6',
    secondary: '#E5BFA8',
    onSecondary: '#442B17',
    secondaryContainer: '#5E402B',
    onSecondaryContainer: '#FFDBCA',
    tertiary: '#D9C384',
    onTertiary: '#3A3005',
    tertiaryContainer: '#52461A',
    onTertiaryContainer: '#F6DF9E',
    surface: '#0F0F10',
    onSurface: '#E5E2DE',
    surfaceVariant: '#2A2726',
    onSurfaceVariant: '#CEC5C0',
    outline: '#9F8E82',
    error: '#FFB4AB',
    onError: '#690005',
  }
};

export const AppSpacing = {
  none: '0px',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

export const AppRadius = {
  none: '0px',
  sm: '12px',
  md: '24px',
  lg: '32px',
  xl: '40px',
  full: '9999px',
};

export const AppTypography = {
  fontFamilies: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    display: '"Outfit", sans-serif',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    displayLg: { fontSize: '57px', lineHeight: '64px', tracking: '-0.25px' },
    displayMd: { fontSize: '45px', lineHeight: '52px', tracking: '0px' },
    displaySm: { fontSize: '36px', lineHeight: '44px', tracking: '0px' },
    headlineLg: { fontSize: '32px', lineHeight: '40px', tracking: '0px' },
    headlineMd: { fontSize: '28px', lineHeight: '36px', tracking: '0px' },
    headlineSm: { fontSize: '24px', lineHeight: '32px', tracking: '0px' },
    titleLg: { fontSize: '22px', lineHeight: '28px', tracking: '0px' },
    titleMd: { fontSize: '16px', lineHeight: '24px', tracking: '0.15px' },
    titleSm: { fontSize: '14px', lineHeight: '20px', tracking: '0.1px' },
    bodyLg: { fontSize: '16px', lineHeight: '24px', tracking: '0.5px' },
    bodyMd: { fontSize: '14px', lineHeight: '20px', tracking: '0.25px' },
    bodySm: { fontSize: '12px', lineHeight: '16px', tracking: '0.4px' },
    labelLg: { fontSize: '14px', lineHeight: '20px', tracking: '0.1px' },
    labelMd: { fontSize: '12px', lineHeight: '16px', tracking: '0.5px' },
    labelSm: { fontSize: '11px', lineHeight: '16px', tracking: '0.5px' },
  }
};

export const AppElevation = {
  level0: 'none',
  level1: '0px 1px 2px 0px rgba(0, 0, 0, 0.05), 0px 1px 3px 1px rgba(0, 0, 0, 0.02)',
  level2: '0px 1px 2px 0px rgba(0, 0, 0, 0.05), 0px 2px 6px 2px rgba(0, 0, 0, 0.02)',
  level3: '0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 4px 8px 3px rgba(0, 0, 0, 0.02)',
  level4: '0px 2px 3px 0px rgba(0, 0, 0, 0.05), 0px 6px 10px 4px rgba(0, 0, 0, 0.02)',
  level5: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), 0px 8px 12px 6px rgba(0, 0, 0, 0.02)',
};

export const AppMotion = {
  durations: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000,
  },
  curves: {
    // Standard: Used moving elements between resting states
    standard: [0.2, 0.0, 0, 1.0] as const,
    // Standard Decelerate: Used for incoming elements
    standardDecelerate: [0.0, 0.0, 0, 1.0] as const,
    // Standard Accelerate: Used for exiting elements
    standardAccelerate: [0.3, 0.0, 1, 1.0] as const,
    // Emphasized: Used for important layout changes
    emphasized: [0.2, 0.0, 0, 1.0] as const,
    // Emphasized Decelerate: Used for important incoming elements
    emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0] as const,
    // Emphasized Accelerate: Used for important exiting elements
    emphasizedAccelerate: [0.3, 0.0, 0.8, 0.15] as const,
  }
};
