import { ConsentStep } from './ConsentStep';
import { CodeStep } from './CodeStep';
import { ContactStep } from './ContactStep';
import { useSignInFlow } from './useSignInFlow';

/** Shows the step the customer is on; the flow hook owns what each step may do. */
export function SignInSteps() {
  const flow = useSignInFlow();
  const { state } = flow;

  switch (state.step) {
    case 'contact':
      return (
        <ContactStep
          initial={state.contact}
          pending={flow.request.pending}
          failure={flow.request.failure}
          onSubmit={flow.sendCode}
          onEdit={flow.dismissRequestFailure}
        />
      );
    case 'code':
      return (
        <CodeStep
          // A new code starts with an empty field and its own countdown.
          key={state.challenge.id}
          contact={state.contact}
          challenge={state.challenge}
          verify={flow.verify}
          resend={flow.request}
          onVerify={flow.verifyCode}
          onResend={flow.resendCode}
          onChangeContact={flow.changeContact}
        />
      );
    case 'consent':
      return (
        <ConsentStep
          channel={state.contact.channel}
          versions={state.versions}
          versionsChanged={state.versionsChanged}
          verify={flow.verify}
          onAccept={flow.acceptTerms}
          onBack={flow.changeContact}
        />
      );
  }
}
