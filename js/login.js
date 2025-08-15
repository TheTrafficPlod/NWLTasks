const users = [
    { u: 'A.Mars', p: 'callumcollins1' },
    { u: 'N.Henderson', p: 'Cameron2010!' },
    { u: 'T.Mills', p: 'NWLRP401250.!' }
];

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const isValid = users.some(user => 
        user.u === username && user.p === password
    );

    if (isValid) {
        const timestamp = Date.now();
        const token = btoa(`${username}-${timestamp}`);
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('currentUser', username);
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials! Please try again.');
    }
});

if (!window.location.href.includes('login.html')) {
    const token = sessionStorage.getItem('auth_token');
    const user = sessionStorage.getItem('currentUser');
    if (!token || !user || !validateToken(token, user)) {
        window.location.href = 'login.html';
    }
}

function validateToken(token, user) {
    try {
        const [username, timestamp] = atob(token).split('-');
        return username === user &&
               (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}
