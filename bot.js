// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Builder
const { ActivityTypes, CardFactory } = require('botbuilder');

// Import dialogs
const { WelcomeCard } = require('./dialogs/welcome');
const { MenuCard } = require('./dialogs/menu');

class MyBot {
  /**
   * Constructs the three pieces necessary for this bot to operate:
   * 1. StatePropertyAccess for user state
   *
   * @param {ConversationState} conversationState property accessor
   * @param {UserState} userState property accessor
   * @param {BotConfiguration} botConfig contents of the .bot file
   */
  constructor(conversationState, userState, botConfig) {
      if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
      if (!userState) throw new Error('Missing parameter.  userState is required');
      if (!botConfig) throw new Error('Missing parameter.  botConfig is required');
      this.userState = userState;
  }

   /**
    * Driver code that does one of the following:
    * 1. Display a welcome card when User joins
    *
    * @param {Context} context turn context from the adapter
    */
    async onTurn(context) {
      const name = context.activity.from.name.split(' ')
      if (context.activity.type === ActivityTypes.Message) {
        const _request = context.activity.text.toLowerCase()
          let _message

          switch (_request.toLowerCase()) {
            case 'q':
              _message = 'There are X messages in the Queue'
              await context.sendActivity(_message);
              break;
            case 'd':
              _message = 'Queue details'
              await context.sendActivity(_message);
              break;
            case 'w':
              const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
              welcomeCard.content.body[0].text = `Hi ${name[0]}, welcome to the GLG Surveys Bot`
              await context.sendActivity({ attachments: [welcomeCard] });
              break;
            default:
              await context.sendActivity(`Sorry ${name[0]}, I dont understand that request..... here is more info`);
              const menuCard = CardFactory.adaptiveCard(MenuCard);
              await context.sendActivity({ attachments: [menuCard] });
          }
      } else if (this.userState.properties.firstTime == null) {
        this.userState.properties.firstTime = false
        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
        welcomeCard.content.body[0].text = `Hi ${name[0]}, welcome to the GLG Surveys Bot`
        await context.sendActivity({ attachments: [welcomeCard] });
      }

      await this.userState.saveChanges(context);
    }
}

module.exports.MyBot = MyBot;
