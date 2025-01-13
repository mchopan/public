function requireAuth() {
    if (!localStorage.getItem('adminToken')) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

export default requireAuth; 