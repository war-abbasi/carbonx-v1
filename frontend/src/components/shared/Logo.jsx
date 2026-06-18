import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import logoImg from '../../assets/carbonx-logo.png';
import iconImg from '../../assets/carbonx-icon.png';

export function Logo({ variant = 'full', className, linkTo = '/' }) {
  const content =
    variant === 'icon' ? (
      <img
        src={iconImg}
        alt="CarbonX"
        className={cn('h-10 w-10 object-contain', className)}
      />
    ) : (
      /* The source PNG is a 500x500 square with heavy transparent padding.
         Crop the padding with overflow-hidden and scale the mark up so it reads large. */
      <div className={cn('relative overflow-hidden flex items-center justify-center', className)}>
        <img
          src={logoImg}
          alt="CarbonX"
          className="w-full h-full object-contain"
          style={{ transform: 'scale(2.1)', display: 'block' }}
        />
      </div>
    );

  return (
    <Link to={linkTo} className="flex items-center focus:outline-none">
      {content}
    </Link>
  );
}
