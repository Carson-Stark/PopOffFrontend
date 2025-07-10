export const loginAction = (payload) => {
    return {
        type: 'login',
        payload
    }
}

export const logoutAction = () => {
    return {
        type: 'logout'
    }
}

export const blockUserAction = (username) => ({
    type: 'block_user',
    payload: { username }
});