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
      /* Crop any whitespace by using a constrained container with overflow-hidden */
      <div className={cn('flex items-center', className)}>
        <img
          src={logoImg}
          alt="CarbonX"
          className="h-full w-auto object-contain"
          style={{ maxHeight: '100%', display: 'block' }}
        />
      </div>
    );

  return (
    <Link to={linkTo} className="flex items-center focus:outline-none">
      {content}
    </Link>
  );
}
