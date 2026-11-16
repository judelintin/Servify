import {requireMobileApp} from '@/lib/server/website-access';
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";
import { PreviewNote } from "@/components/ui/primitives";
export default function Layout({ children }: { children: React.ReactNode }) { requireMobileApp();
  return <div className="auth-shell"><aside className="auth-aside"><Brand/><div className="auth-aside-copy"><div className="eyebrow">A good place to begin</div><h2>Every great job starts with the right connection.</h2><p>For the people who need a hand, and the professionals who make things happen.</p></div><span className="auth-aside-bottom">Find the right person. Get it done.</span></aside><div className="auth-main"><Link href="/" className="auth-back"><Icon name="arrow-left" size={16}/>Back to Servify</Link><main id="main-content" className="auth-panel" tabIndex={-1}>{children}</main><PreviewNote/></div></div>;
}
