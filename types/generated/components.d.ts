import type { Schema, Struct } from '@strapi/strapi';

export interface GamePlayer extends Struct.ComponentSchema {
  collectionName: 'components_game_players';
  info: {
    displayName: 'Player';
  };
  attributes: {
    joinedAt: Schema.Attribute.DateTime;
    nickname: Schema.Attribute.String & Schema.Attribute.Required;
    score: Schema.Attribute.Integer;
    userId: Schema.Attribute.String;
  };
}

export interface QuizAnswer extends Struct.ComponentSchema {
  collectionName: 'components_quiz_answers';
  info: {
    displayName: 'Answer';
  };
  attributes: {
    isCorrect: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface QuizRound extends Struct.ComponentSchema {
  collectionName: 'components_quiz_rounds';
  info: {
    displayName: 'Round';
  };
  attributes: {
    order: Schema.Attribute.Integer;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
  };
  attributes: {
    metaDescription: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String;
    shareImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'game.player': GamePlayer;
      'quiz.answer': QuizAnswer;
      'quiz.round': QuizRound;
      'shared.seo': SharedSeo;
    }
  }
}
