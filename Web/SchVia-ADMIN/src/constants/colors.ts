export const colors = {
  light: {
    primary: '#6A5ACD', // Main purple color
    primaryLight: '#BEB9D1', // Light purple for inactive icons
    secondary: '#cbd5ff', // Light blue for card trend
    background: '#f9f9ff', // Light background
    white: '#fff',
    black: '#000',
    present: '#4CAF50',
    leave: '#FFC107',
    absent: '#FF4C4C',
    error: '#FF4C4C',
    navbariconoff: '#cbd5ff',
    avatarImageBorder: '#cbd5ff',
    headings: '#6A5ACD',
    text: {
      primary: '#333',
      secondary: '#666',
      light: '#888',
    },
    SlideToConfirmButtoncolors: {
      mark: '#f9f9ff',
      text: '#333',
      textconfirm: '#f9f9ff',
      circle: '#6A5ACD',
      circleconfirm: '#f9f9ff',
      conatiner: '#cbd5ff',
      containerconfirm: '#4CAF50',
      disabledCircle: '#999',
      disabledContainer: '#ccc',
    },
    cardinfo: {
      cardtextcolor: '#fff',
      reload: '#fff',
      cardtextcolorsecondary: '#E5E5E5',
    },
    classcolors: {
      1: '#FFE0B2', // Soft Peach / Light Orange
      2: '#F8BBD0', // Light Pink
      3: '#C8E6C9', // Light Green (fresh and balanced)
      4: '#BBDEFB', // Light Blue (cool and calming)
      5: '#D1C4E9', // Lavender / Light Purple (soft and elegant)
      6: '#FFF9C4', // Light Yellow (bright but subtle)
      7: '#FFCCBC', // Light Coral / Soft Red (warm tone)
      8: '#B2EBF2', // Light Cyan (refreshing accent)
      9: '#E1BEE7', // Light Violet (pleasant pastel)
      10: '#DCEDC8', // Light Lime Green (energetic yet soft)
    },
    card: {
      shadow: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
      },
    },
  },
  dark: {
    primary: '#6A5ACD', // Keep main purple for brand consistency
    primaryLight: '#4A3B9D', // Darker purple for inactive icons
    secondary: '#3F3D56', // Darker blue for card trend
    navbariconoff: '#cbd5ff',
    background: '#1A1A2E', // Dark background
    white: '#3F3D56', // Slightly off-white for better dark mode
    black: '#000',
    present: '#4CAF50',
    leave: '#FFC107',
    absent: '#FF4C4C',
    error: '#FF4C4C',
    avatarImageBorder: '#cbd5ff',
    headings: '#f9f9ff',
    text: {
      primary: '#E5E5E5',
      secondary: '#A0A0A0',
      light: '#707070',
    },
    SlideToConfirmButtoncolors: {
      mark: '#f9f9ff',
      text: '#E5E5E5',
      textconfirm: '#f9f9ff',
      circle: '#6A5ACD',
      circleconfirm: '#f9f9ff',
      conatiner: '#3F3D56',
      containerconfirm: '#4CAF50',
      disabledCircle: '#999',
      disabledContainer: '#ccc',
    },
    cardinfo: {
      cardtextcolor: '#fff',
      reload: '#fff',
      cardtextcolorsecondary: '#E5E5E5',
    },
    classcolors: {
      1: '#FFE0B2', // Soft Peach / Light Orange
      2: '#F8BBD0', // Light Pink
      3: '#C8E6C9', // Light Green (fresh and balanced)
      4: '#BBDEFB', // Light Blue (cool and calming)
      5: '#D1C4E9', // Lavender / Light Purple (soft and elegant)
      6: '#FFF9C4', // Light Yellow (bright but subtle)
      7: '#FFCCBC', // Light Coral / Soft Red (warm tone)
      8: '#B2EBF2', // Light Cyan (refreshing accent)
      9: '#E1BEE7', // Light Violet (pleasant pastel)
      10: '#DCEDC8', // Light Lime Green (energetic yet soft)
    },
    card: {
      shadow: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
      },
    },
  },
};

export type Colors = typeof colors;

export const getColor = (
  colorPath: string,
  theme: 'light' | 'dark' = 'light'
): string => {
  const parts = colorPath.split('.');
  let value: any = colors[theme];

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return '';
    }
  }

  return typeof value === 'string' ? value : '';
};