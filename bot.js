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
    async onTurn1(turnContext) {
      console.log('onTurn activity: ', JSON.stringify(turnContext.activity));
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        //const dc = await this.dialogSet.createContext(turnContext);

        if (turnContext.activity.type === ActivityTypes.Message) {
          let dialogResult;
          // Create a dialog context
          const dc = await this.dialogs.createContext(turnContext);

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
              await dc.beginDialog(GREETING_DIALOG);
              /*
              //await turnContext.sendActivity(`You said '${ turnContext.activity.text }'`);
              await turnContext.sendActivity('Sorry, I dont understand what you asked for, so here is more info....');
              await turnContext.sendActivity(HELP_MESSAGE);
              //await dc.beginDialog(HELP_MESSAGE);
              */
          }
        } else {
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    async onTurn(context) {
        // Handle Message activity type, which is the main activity type for shown within a conversational interface
        // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        if (context.activity.type === ActivityTypes.Message) {
            let dialogResult;
            // Create a dialog context
            const dc = await this.dialogs.createContext(context);

            // Perform a call to LUIS to retrieve results for the current activity message.
            //const results = await this.luisRecognizer.recognize(context);
            //const topIntent = LuisRecognizer.topIntent(results);
            const topIntent = GREETING_INTENT
            const results = {}

            // update user profile property with any entities captured by LUIS
            // This could be user responding with their name or city while we are in the middle of greeting dialog,
            // or user saying something like 'i'm {userName}' while we have no active multi-turn dialog.
            //await this.updateUserProfile(results, context);

            // Based on LUIS topIntent, evaluate if we have an interruption.
            // Interruption here refers to user looking for help/ cancel existing dialog
            const interrupted = await this.isTurnInterrupted(dc, results);
            if (interrupted) {
                if (dc.activeDialog !== undefined) {
                    // issue a re-prompt on the active dialog
                    dialogResult = await dc.repromptDialog();
                } // Else: We don't have an active dialog so nothing to continue here.
            } else {
                // No interruption. Continue any active dialogs.
                dialogResult = await dc.continueDialog();
            }

            // If no active dialog or no active dialog has responded,
            if (!dc.context.responded) {
                // Switch on return results from any active dialog.
                switch (dialogResult.status) {
                // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                case DialogTurnStatus.empty:
                    // Determine what we should do based on the top intent from LUIS.
                    switch (topIntent) {
                    case GREETING_INTENT:
                        await dc.beginDialog(GREETING_DIALOG);
                        break;
                    case NONE_INTENT:
                    default:
                        // None or no intent identified, either way, let's provide some help
                        // to the user
                        await dc.context.sendActivity(`I didn't understand what you just said to me.`);
                        break;
                    }
                    break;
                case DialogTurnStatus.waiting:
                    // The active dialog is waiting for a response from the user, so do nothing.
                    break;
                case DialogTurnStatus.complete:
                    // All child dialogs have ended. so do nothing.
                    break;
                default:
                    // Unrecognized status from child dialog. Cancel all dialogs.
                    await dc.cancelAllDialogs();
                    break;
                }
            }
        } else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            // Handle ConversationUpdate activity type, which is used to indicates new members add to
            // the conversation.
            // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

            // Do we have any new members added to the conversation?
            if (context.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in context.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message
                    // the 'bot' is the recipient for events from the channel,
                    // context.activity.membersAdded == context.activity.recipient.Id indicates the
                    // bot was added to the conversation.
                    if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                        // Welcome user.
                        // When activity type is "conversationUpdate" and the member joining the conversation is the bot
                        // we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
                        // To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        await context.sendActivity({ attachments: [welcomeCard] });
                    }
                }
            }
        }

        // make sure to persist state at the end of a turn.
        await this.conversationState.saveChanges(context);
        await this.userState.saveChanges(context);
    }

    /**
     * Look at the LUIS results and determine if we need to handle
     * an interruptions due to a Help or Cancel intent
     *
     * @param {DialogContext} dc - dialog context
     * @param {LuisResults} luisResults - LUIS recognizer results
     */
    async isTurnInterrupted(dc, luisResults) {
        //const topIntent = LuisRecognizer.topIntent(luisResults);
        const topIntent = NONE_INTENT
        // see if there are any conversation interrupts we need to handle
        if (topIntent === CANCEL_INTENT) {
            if (dc.activeDialog) {
                // cancel all active dialog (clean the stack)
                await dc.cancelAllDialogs();
                await dc.context.sendActivity(`Ok.  I've cancelled our last activity.`);
            } else {
                await dc.context.sendActivity(`I don't have anything to cancel.`);
            }
            return true; // this is an interruption
        }

        if (topIntent === HELP_INTENT) {
            await dc.context.sendActivity(`Let me try to provide some help.`);
            await dc.context.sendActivity(HELP_MESSAGE);
            return true; // this is an interruption
        }
        return false; // this is not an interruption
    }
}

module.exports.MyBot = MyBot;
