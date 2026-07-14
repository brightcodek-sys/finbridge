import { Link, useRoute } from 'wouter';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  PiggyBank, 
  Users, 
  Lightbulb, 
  ShieldCheck 
} from 'lucide-react';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/kyc', label: 'KYC', icon: ShieldCheck },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
            FinBridge
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Financial Command Center
          </p>
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const [isActive] = useRoute(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>Wema Bank Hackaholics 7.0</p>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
