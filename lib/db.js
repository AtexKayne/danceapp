
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

export const fetchData = async (url, options) => {
    document.body.dataset.load = 'true'
    const data = await fetch(url, options)

    setTimeout(() => {
        document.body.dataset.load = 'false'
    }, 500);

    return data
}