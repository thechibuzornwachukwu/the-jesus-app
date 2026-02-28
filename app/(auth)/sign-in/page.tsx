import { AuthForm } from '../../../libs/shared-ui/AuthForm';
import { signIn } from '../../../lib/auth/actions';

export const metadata = { title: 'Sign In — The JESUS App' };

export default function SignInPage() {
  return <AuthForm mode="sign-in" action={signIn} />;
}
