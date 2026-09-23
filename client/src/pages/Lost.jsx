import { Link } from 'react-router-dom';
import { LottieSlot } from '../components/LottieSlot';

export default function Lost() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6">
      <LottieSlot name="lost" className="h-36 w-36" />
      <h1 className="font-serif text-4xl">This shelf is empty.</h1>
      <p className="mt-3 text-mute">That page is not part of the reading room, or your role does not open it.</p>
      <Link to="/" className="mt-6 text-sm text-pine">
        Return to today
      </Link>
    </div>
  );
}
