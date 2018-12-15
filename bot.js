// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//const { ActivityTypes } = require('botbuilder');
//const { DialogSet, WaterfallDialog, NumberPrompt, DateTimePrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


// Import required Bot Builder
const { ActivityTypes, CardFactory } = require('botbuilder');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

// Import dialogs
const { UserProfile } = require('./dialogs/greeting/userProfile');
const { WelcomeCard } = require('./dialogs/welcome');
const { MenuCard } = require('./dialogs/menu');
const { GreetingDialog } = require('./dialogs/greeting');

// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

// LUIS service type entry as defined in the .bot file.
const LUIS_CONFIGURATION = 'chat-LUIS';

// Supported LUIS Intents.
const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';

// Supported LUIS Entities, defined in ./dialogs/greeting/resources/greeting.lu
const USER_NAME_ENTITIES = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES = ['userLocation', 'userLocation_patternAny'];

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
    * 1. Display a welcome card upon when User joins
    *
    * @param {Context} context turn context from the adapter
    */
    async onTurn(context) {
      if (context.activity.type === ActivityTypes.Message) {
        let dialogResult;
        // Create a dialog context
        const _request = context.activity.text.toLowerCase()
          console.log('_request: ', _request);
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
            default:
              await context.sendActivity(`Sorry ${context.activity.from.name}, I dont understand that request..... here is more info`);
              const menuCard = CardFactory.adaptiveCard(MenuCard);
              await context.sendActivity({ attachments: [menuCard] });
          }
      } else if (this.userState.properties.firstTime == null) {
        this.userState.properties.firstTime = false
        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
        console.log('welcomeCard: ', JSON.stringify(welcomeCard));
        await context.sendActivity({ attachments: [welcomeCard] });
      }

      // make sure to persist state at the end of a turn.
      //await this.conversationState.saveChanges(context);
      await this.userState.saveChanges(context);
    }
}

module.exports.MyBot = MyBot;
