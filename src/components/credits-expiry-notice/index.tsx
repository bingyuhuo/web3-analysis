import { useEffect, useState } from 'react';
import { UserCredits } from '@/types/user';

interface Props {
  credits: UserCredits | null;
}

export default function CreditsExpiryNotice({ credits }: Props) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (credits?.days_until_expiry && credits.days_until_expiry <= 3 && credits.days_until_expiry > 0) {
      setShowNotice(true);
    }
  }, [credits]);

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Credits are about to expire!</strong>
      <span className="block sm:inline">
        {` You have ${credits?.monthly_credits} credits that will expire in ${credits?.days_until_expiry} days, please use them soon.`}
      </span>
      <button 
        className="absolute top-0 right-0 px-4 py-3"
        onClick={() => setShowNotice(false)}
      >
        <span className="text-2xl">&times;</span>
      </button>
    </div>
  );
} 