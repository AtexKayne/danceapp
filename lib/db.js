
export const getData = async () => {
    try {
        const response = await fetch(process.env.REQUEST_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

export const updateData = async (newData) => {
    try {
        const response = await fetch(process.env.REQUEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}

export const fetchData = async (options) => {
    document.body.dataset.load = 'true'
    let query = ''
    let data

    if (!options || !options.method) {
        query = options.isAdmin ? '/?isAdmin=true' : '/?isIndex=true'
    }
    try {
        data = await fetch(`/api/api${query}`, options)
    } catch (error) {
        console.info(error);
    }

    setTimeout(() => {
        document.body.dataset.load = 'false'
    }, 500);

    return data
}

// const t = {
//     groups: [
//         [
//             {
//                 id: "groupId",
//                 name: "groupName",
//                 date: "groupDate",
//                 attendances: "groupAttendances",
//                 empty: "groupEmpty",
//                 time: "groupTime"
//             },
//             // ...
//         ]
//     ],
//     attendances: {
//         "groupId": {
//             id: 'id',
//             firstName: 'firstName',
//             lastName: 'lastName',
//             gender: 'gender',
//             groupId: 'groupId',
//             isSupport: 'isSupport',
//         },
//         // ...
//     },
//     empty: {
//         "groupId": {
//             id: 'id',
//             firstName: 'firstName',
//             lastName: 'lastName',
//             gender: 'gender',
//             groupId: 'groupId',
//             isSupport: 'isSupport',
//         },
//         // ...
//     },
//     schedule: [
//         {
//             "id": "scheduleId",
//             "day": "scheduleDay",
//             "groups": "scheduleGroups",
//             "none": "scheduleNone"
//         },
//         // ...
//     ]
// }

export const getNewData = async (query) => {
    let url
    if (query.isAdmin) {
        url = `${process.env.REQUEST_URL_NEW}?isAdmin=true`
    } else {
        url = `${process.env.REQUEST_URL_NEW}?isIndex=true`
    }
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

export const updateNewData = async (newData) => {
    try {
        const response = await fetch(process.env.REQUEST_URL_NEW, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}


export const deleteNewData = async (newData) => {
    try {
        const response = await fetch(process.env.REQUEST_URL_NEW, {
            method: 'DELETE',
            body: JSON.stringify(newData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}

