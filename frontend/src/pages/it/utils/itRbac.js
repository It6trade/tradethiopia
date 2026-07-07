import { normalizeRole } from '../../../store/user';

const includesAny = (value = '', words = []) => {
  const text = String(value || '').toLowerCase();
  return words.some((word) => text.includes(word));
};

export const IT_ROLE_KEYS = {
  MANAGER: 'it-manager',
  TEAM_LEADER: 'it-team-leader',
  STAFF: 'it-staff',
};

export const getItPersona = (user = {}) => {
  const normalizedRole = normalizeRole(user.role || user.displayRole || '');
  const displayRole = String(user.displayRole || user.role || '');
  const jobTitle = String(user.jobTitle || '');
  const username = String(user.username || '');

  if (
    normalizedRole === 'admin'
    || normalizedRole === 'itmanager'
    || includesAny(displayRole, ['it manager'])
    || includesAny(jobTitle, ['it manager'])
    || includesAny(username, ['it4', 'admin'])
  ) {
    return {
      key: IT_ROLE_KEYS.MANAGER,
      label: 'IT Manager',
      description: 'Full platform visibility, project controls, and user administration.',
      canViewAllTasks: true,
      canManageUsers: true,
      canDeleteTasks: true,
      canCreateTasks: true,
      canApproveTasks: true,
      canComment: true,
      canViewTaskActions: true,
      hasExecutiveDashboard: true,
      hasPersonalNotes: true,
    };
  }

  if (
    normalizedRole === 'itteamleader'
    || includesAny(displayRole, ['team leader', 'lead'])
    || includesAny(jobTitle, ['team leader', 'lead'])
  ) {
    return {
      key: IT_ROLE_KEYS.TEAM_LEADER,
      label: 'IT Team Leader',
      description: 'Views and manages only tasks where they are the task leader or personally assigned.',
      canViewAllTasks: false,
      canViewLedTasks: true,
      canManageUsers: false,
      canDeleteTasks: false,
      canCreateTasks: true,
      canApproveTasks: true,
      canComment: true,
      canViewTaskActions: true,
      hasExecutiveDashboard: false,
      hasPersonalNotes: true,
    };
  }

  return {
    key: IT_ROLE_KEYS.STAFF,
    label: 'IT Staff',
    description: 'Views assigned work, receives task reminders, keeps notes, and tracks personal KPIs.',
    canViewAllTasks: false,
    canManageUsers: false,
    canDeleteTasks: false,
    canCreateTasks: false,
    canApproveTasks: false,
    canComment: true,
    canViewTaskActions: false,
    hasExecutiveDashboard: false,
    hasPersonalNotes: true,
  };
};

export const getUserTaskAliases = (user = {}) => (
  [
    user._id,
    user.id,
    user.email,
    user.username,
    user.fullName,
    user.name,
  ]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase())
);

export const isTaskAssignedToUser = (task = {}, user = {}) => {
  const aliases = getUserTaskAliases(user);
  const leader = String(task.taskLeader || '').trim().toLowerCase();
  return (
    (leader && aliases.includes(leader))
    || (task.assignedTo || []).some((assignee) => aliases.includes(String(assignee).trim().toLowerCase()))
  );
};

export const filterTasksForPersona = (tasks = [], persona, user) => {
  if (persona?.canViewAllTasks) return tasks;
  return tasks.filter((task) => isTaskAssignedToUser(task, user));
};
