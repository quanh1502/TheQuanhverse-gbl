import React from 'react';

export enum RoomType {
  VOID = 'VOID',
  IDENTITY = 'IDENTITY', // ISTJ, Taurus
  CAFE = 'CAFE', // Coffee passion
  AUDIO = 'AUDIO', // Audiophile, Music
  TECH = 'TECH', // Gadgets
  PRISM = 'PRISM', // Ambivert nature
}

export interface RoomConfig {
  id: RoomType;
  title: string;
  description: string;
  icon: React.FC<any>;
  color: string;
}