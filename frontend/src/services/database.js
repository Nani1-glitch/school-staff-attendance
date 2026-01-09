// IndexedDB database service for frontend-only storage
const DB_NAME = 'attendanceDB';
const DB_VERSION = 2;
const STORES = {
  USERS: 'users',
  TEACHERS: 'teachers',
  ATTENDANCE: 'attendance',
  SETTINGS: 'settings'
};

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Users store
      if (!database.objectStoreNames.contains(STORES.USERS)) {
        const userStore = database.createObjectStore(STORES.USERS, { keyPath: 'id' });
        userStore.createIndex('phoneOrEmail', 'phoneOrEmail', { unique: true });
      }

      // Teachers store
      if (!database.objectStoreNames.contains(STORES.TEACHERS)) {
        const teacherStore = database.createObjectStore(STORES.TEACHERS, { keyPath: 'id' });
        teacherStore.createIndex('name', 'name', { unique: false });
        teacherStore.createIndex('department', 'department', { unique: false });
      }

      // Attendance store
      if (!database.objectStoreNames.contains(STORES.ATTENDANCE)) {
        const attendanceStore = database.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id' });
        attendanceStore.createIndex('teacherId', 'teacherId', { unique: false });
        attendanceStore.createIndex('date', 'date', { unique: false });
        attendanceStore.createIndex('teacherId_date', ['teacherId', 'date'], { unique: true });
      }

      // Settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };
  });
};

const getStore = (storeName, mode = 'readonly') => {
  if (!db) throw new Error('Database not initialized');
  return db.transaction([storeName], mode).objectStore(storeName);
};

// User operations
export const getUserByEmail = async (phoneOrEmail) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.USERS, 'readonly');
    const index = store.index('phoneOrEmail');
    const request = index.get(phoneOrEmail);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const createUser = async (user) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.USERS, 'readwrite');
    const request = store.add(user);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Teacher operations
export const getAllTeachers = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.TEACHERS, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.filter(t => t.active !== false));
    request.onerror = () => reject(request.error);
  });
};

export const getTeacher = async (id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.TEACHERS, 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const createTeacher = async (teacher) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.TEACHERS, 'readwrite');
    const teacherData = {
      id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...teacher,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const request = store.add(teacherData);
    request.onsuccess = () => resolve(teacherData);
    request.onerror = () => reject(request.error);
  });
};

export const updateTeacher = async (id, updates) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.TEACHERS, 'readwrite');
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const teacher = getRequest.result;
      const updated = {
        ...teacher,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const deleteTeacher = async (id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.TEACHERS, 'readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Attendance operations
export const getTodayAttendance = async () => {
  await initDB();
  // Get today's date in Indian timezone
  const now = new Date();
  const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayDate = indianDate.toISOString().split('T')[0];
  return getAttendanceByDate(todayDate);
};

export const getAttendanceByDate = async (date) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.ATTENDANCE, 'readonly');
    const index = store.index('date');
    const request = index.getAll(date);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAttendanceByTeacherAndDate = async (teacherId, date) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.ATTENDANCE, 'readonly');
    const index = store.index('teacherId_date');
    const request = index.get([teacherId, date]);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const createOrUpdateAttendance = async (record) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.ATTENDANCE, 'readwrite');
    const index = store.index('teacherId_date');
    const getRequest = index.get([record.teacherId, record.date]);
    
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      const attendanceData = {
        id: existing?.id || `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...record,
        updatedAt: new Date().toISOString(),
        createdAt: existing?.createdAt || new Date().toISOString()
      };
      const putRequest = store.put(attendanceData);
      putRequest.onsuccess = () => resolve(attendanceData);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => {
      // No existing record, create new
      const attendanceData = {
        id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...record,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const addRequest = store.add(attendanceData);
      addRequest.onsuccess = () => resolve(attendanceData);
      addRequest.onerror = () => reject(addRequest.error);
    };
  });
};

export const getAttendanceRecords = async (filters = {}) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.ATTENDANCE, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => {
      let records = request.result || [];
      
      // Apply filters
      if (filters.startDate) {
        records = records.filter(r => r.date >= filters.startDate);
      }
      if (filters.endDate) {
        records = records.filter(r => r.date <= filters.endDate);
      }
      if (filters.teacherId) {
        records = records.filter(r => r.teacherId === filters.teacherId);
      }
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }
      
      // Sort by date desc, then by teacher name
      records.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return 0;
      });
      
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
};

// Settings operations
export const getSettings = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.SETTINGS, 'readonly');
    const request = store.get('default');
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        // Return default settings
        const defaults = {
          id: 'default',
          startTime: '09:00',
          endTime: '17:00',
          graceMinutes: 15,
          halfDayMinutes: 240,
          timezone: 'UTC',
          weekendDays: 'Saturday,Sunday'
        };
        resolve(defaults);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const updateSettings = async (settings) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(STORES.SETTINGS, 'readwrite');
    const settingsData = {
      id: 'default',
      ...settings,
      updatedAt: new Date().toISOString()
    };
    const request = store.put(settingsData);
    request.onsuccess = () => resolve(settingsData);
    request.onerror = () => reject(request.error);
  });
};

// Initialize default data
export const initializeDefaultData = async () => {
  await initDB();
  
  // Check if admin exists
  const admin = await getUserByEmail('admin@school.com').catch(() => null);
  
  if (!admin) {
    // Create admin user
    try {
      const bcrypt = await import('bcryptjs');
      const pinHash = await bcrypt.default.hash('1234', 10);
      
      await createUser({
        id: 'admin_1',
        name: 'Admin User',
        role: 'ADMIN',
        phoneOrEmail: 'admin@school.com',
        pinHash,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      // Ignore if user already exists (ConstraintError)
      if (error.name !== 'ConstraintError') {
        console.error('Failed to create admin user:', error);
      }
    }
  }
  
  // Check if settings exist
  const settings = await getSettings();
  if (!settings.id || settings.id !== 'default') {
    await updateSettings({
      startTime: '09:00',
      endTime: '17:00',
      graceMinutes: 15,
      halfDayMinutes: 240,
      timezone: 'Asia/Kolkata', // Indian timezone
      weekendDays: 'Saturday,Sunday'
    });
  }
};
