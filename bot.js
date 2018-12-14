// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//const { ActivityTypes } = require('botbuilder');
//const { DialogSet, WaterfallDialog, NumberPrompt, DateTimePrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

const HELP_MESSAGE = `\`\`\`
Hello from Survey Bot!
Here is what I do:

q       - Tell me how many invites are in the queue
qd      - Provide detailsof the first 10 invites in the queue
help    - Show this Help
\`\`\``;

// Import required Bot Builder
const { ActivityTypes, CardFactory } = require('botbuilder');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

// Import dialogs
const { UserProfile } = require('./dialogs/greeting/userProfile');
const { WelcomeCard } = require('./dialogs/welcome');
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
   * 1. StatePropertyAccessor for conversation state
   * 2. StatePropertyAccess for user state
   * 3. LUIS client
   * 4. DialogSet to handle our GreetingDialog
   *
   * @param {ConversationState} conversationState property accessor
   * @param {UserState} userState property accessor
   * @param {BotConfiguration} botConfig contents of the .bot file
   */
  constructor(conversationState, userState, botConfig) {
      if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
      if (!userState) throw new Error('Missing parameter.  userState is required');
      if (!botConfig) throw new Error('Missing parameter.  botConfig is required');


      // Create the property accessors for user and conversation state
      this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
      this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

      // Create top-level dialog(s)
      this.dialogs = new DialogSet(this.dialogState);
      // Add the Greeting dialog to the set
      this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));

      this.conversationState = conversationState;
      this.userState = userState;
  }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
      console.log('onTurn activity: ', JSON.stringify(turnContext.activity));
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        //const dc = await this.dialogSet.createContext(turnContext);

        if (turnContext.activity.type === ActivityTypes.Message) {
          switch(turnContext.activity.text.toLowerCase()) {
            case 'q':
              await turnContext.sendActivity('processing request, please wait');
              let typing = turnContext.Activity.createReply();
              typing.Type = ActivityTypes.Typing;
              await turnContext.sendActivity(typing);
              await turnContext.sendActivity('There are 20 invites in the queue');
              break;
            case 'qd':
              await turnContext.sendActivity('processing request, please wait');
              await turnContext.sendActivity('Here are the details....');
              break;
            default:
              //await turnContext.sendActivity(`You said '${ turnContext.activity.text }'`);
              await turnContext.sendActivity('Sorry, I dont understand what you asked for, so here is more info....');
              await turnContext.sendActivity(HELP_MESSAGE);
              //await dc.beginDialog(HELP_MESSAGE);
          }
        } else {
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }
}

module.exports.MyBot = MyBot;
