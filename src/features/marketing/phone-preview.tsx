import Image from 'next/image';
import customerHome from '../../../public/images/app/customer-home-hd.png';
import professionalHome from '../../../public/images/app/professional-home-hd.png';
import postJob from '../../../public/images/app/post-job-hd.png';

const screens = {
  customer: {src: customerHome, alt: 'Servify Customer Home with a Post a job action, service categories and bottom navigation.'},
  professional: {src: professionalHome, alt: 'Servify Professional Home with profile setup guidance and professional navigation.'},
  request: {src: postJob, alt: 'The Servify job-request form with service category cards and a seven-step progress indicator.'},
} as const;
export type AppScreen = keyof typeof screens;
export function PhonePreview({screen, priority = false}: {screen: AppScreen; priority?: boolean}) {
  const image = screens[screen];
  return <div className="app-phone" data-screen={screen}>
    <div className="phone-glass" aria-hidden="true"/>
    <span className="phone-time" aria-hidden="true">9:41</span>
    <div className="phone-capture" key={screen}><Image src={image.src} alt={image.alt} width={390} height={772} sizes="(max-width: 767px) 260px, 310px" preload={priority}/></div>
    <Image className="phone-hardware" src="/images/devices/iphone-11-frame.svg" alt="" width={454} height={906} unoptimized aria-hidden="true"/>
    <span className="phone-reflection" aria-hidden="true"/>
  </div>;
}
