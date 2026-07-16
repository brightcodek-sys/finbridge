// Mock authentication system with localStorage

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// Mock database of users
const getUsersFromStorage = (): { [key: string]: User & { password: string } } => {
  const stored = localStorage.getItem('finbridge_users');
  if (!stored) {
    // Initialize with demo user
    const defaultUsers = {
      'demo@finbridge.com': {
        id: '1',
        email: 'demo@finbridge.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: '+234 801 000 0001',
        password: 'Demo@1234',
        createdAt: new Date().toISOString(),
      },
    };
    localStorage.setItem('finbridge_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(stored);
};

const saveUsersToStorage = (users: any) => {
  localStorage.setItem('finbridge_users', JSON.stringify(users));
};

export const signupUser = async (
  data: SignupData
): Promise<{ success: boolean; error?: string; user?: User }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getUsersFromStorage();

      // Check if user already exists
      if (users[data.email]) {
        resolve({ success: false, error: 'Email already registered' });
        return;
      }

      const newUser: User & { password: string } = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        createdAt: new Date().toISOString(),
      };

      users[data.email] = newUser;
      saveUsersToStorage(users);

      resolve({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          createdAt: newUser.createdAt,
        },
      });
    }, 500);
  });
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getUsersFromStorage();
      const user = users[email];

      if (!user || user.password !== password) {
        resolve({ success: false, error: 'Invalid email or password' });
        return;
      }

      // Store session
      const sessionUser: User = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      };

      localStorage.setItem('finbridge_session', JSON.stringify(sessionUser));
      localStorage.setItem('isLoggedIn', 'true');

      resolve({ success: true, user: sessionUser });
    }, 500);
  });
};

export const getUser = (): User | null => {
  const session = localStorage.getItem('finbridge_session');
  if (!session) {
    return null;
  }
  return JSON.parse(session);
};

export const logoutUser = () => {
  localStorage.removeItem('finbridge_session');
  localStorage.removeItem('isLoggedIn');
};

export const isLoggedIn = (): boolean => {
  return localStorage.getItem('isLoggedIn') === 'true';
};
