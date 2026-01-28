export const ROLES = {
    STUDENT: 'student',
    VERIFIER: 'verifier',
    ADMIN: 'admin'
};

export const hasRole = (user, requiredRole) => {
    return user && user.role === requiredRole;
};
