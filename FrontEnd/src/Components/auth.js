// auth.js
export const getToken = () => {
    return localStorage.getItem('token'); // Or however you store your token
  };
  
  export const setToken = (token) => {
    localStorage.setItem('token', token);
  };
  
  export const removeToken = () => {
    localStorage.removeItem('token');
  };