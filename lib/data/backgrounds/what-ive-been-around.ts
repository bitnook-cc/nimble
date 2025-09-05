import { BackgroundDefinition } from '../../types/background';

export const whatIveBeenAround: BackgroundDefinition = {
  id: 'what-ive-been-around',
  name: 'What? I\'ve Been Around',
  description: '1/per location (or at the GM\'s discretion). You happen to know JUST the person who has the information you\'re looking for, or could get you out of a jam, and... Roll 1d20:',
  features: [
    {
      id: 'what-ive-been-around-convenient-connections',
      name: 'Convenient Connections',
      description: '1/per location (or at GM\'s discretion). You happen to know JUST the person who has the information you\'re looking for. Roll 1d20: 1-5. They want you DEAD. 6-12. You owe them money. 13-19. They can be convinced to help you. 20. They are your biggest fan/are madly in love with you.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};