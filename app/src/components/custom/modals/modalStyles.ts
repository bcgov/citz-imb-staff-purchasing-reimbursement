import { bcgov } from '../../../constants/colours';

const baseStyle = {
  maxWidth: '25em',
  width: '90%',
  borderRadius: '10px',
};

export const modalStyles = {
  warningModalStyle: {
    ...baseStyle,
    border: `solid ${bcgov.error} 3px`,
  },
  standardModalStyle: {
    ...baseStyle,
    border: `solid ${bcgov.background} 3px`,
  },
};
