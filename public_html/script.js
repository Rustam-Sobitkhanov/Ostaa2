var username = ""
function searchListings() {
    const searchItem = document.getElementById('searchItem').value;
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const items = JSON.parse(this.responseText);
            const searchResultDiv = document.getElementById('searchResult');
            searchResultDiv.innerHTML = '';
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                var status = item.stat;
                if (status.toLowerCase() === 'sale') {
                    itemDiv.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <img src="${item.image}" alt="${item.description}.jpeg" width="200" height="200">
                    <p>Price: ${item.price} USD</p>
                    <button type="button" name="buy">Buy</button>
                    `;
                    const buyButton = itemDiv.querySelector('button[name="buy"]');
                    buyButton.addEventListener('click', function() {
                        this.disable;
                        this.innerHTML = '<p class="sold">SOLD</p>';
                        purchase(item); // call your buyItem function here and pass in the item object
                    });
                } else {
                    itemDiv.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <img src="${item.image}" alt="${item.description}.jpeg" width="200" height="200">
                    <p>Price: ${item.price} USD</p>
                    <p class="sold">SOLD</p>
                    `;
                }
                itemDiv.classList.add("search-item");
                searchResultDiv.appendChild(itemDiv);
            });
        }
    };
    xhr.open('POST', '/search', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(`searchItem=${searchItem}`);
}


function getListings() {
    var usrName = username;
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const items = JSON.parse(this.responseText);
            const searchResultDiv = document.getElementById('searchResult');
            searchResultDiv.innerHTML = '';
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <img src="${item.image}" alt="${item.description}.jpeg" width="200" height="200">
                <p>Price: ${item.price} USD</p>
                <p class="sold">${item.stat.toUpperCase()}</p>
                `;
                itemDiv.classList.add("search-item");
                searchResultDiv.appendChild(itemDiv);
            });
        }
    };
    xhr.open('POST', '/listings', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(`usrName=${usrName}`);
}


function addItem() {
    updateUserOnly();
    var usrName = username;

    // Get the values of all the form inputs
    var title = document.getElementById("title-input").value;
    var description = document.getElementById("description-input").value;
    var price = document.getElementById("price-input").value;
    var stat = document.getElementById("status-input").value;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/addItem', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(`usrName=${usrName}&title=${title}&desc=${description}&price=${price}&&stat=${stat}`);
    if (document.getElementById("add-item-form")) {
        document.getElementById("add-item-form").reset();
        document.getElementsByClassName("loader")[0].style.visibility = "visible";
        document.getElementById("add-item-form").style.filter = "blur(5px)";
        document.getElementById("title").innerText = "";
        //window.location.href = '/home.html';
    }
    xhr.onload = () => {
        window.location.href = '/home.html';
    }
}

function viewPurchase() {
    updateUserOnly();
    var usrName = username;

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const items = JSON.parse(this.responseText);
            const searchResultDiv = document.getElementById('searchResult');
            searchResultDiv.innerHTML = '';
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <img src="${item.image}" alt="${item.description}.jpeg" width="200" height="200">
                <img>Price: ${item.price} USD</img>
                `;
                itemDiv.classList.add("search-item");
                searchResultDiv.appendChild(itemDiv);
            });
        }
    };

    xhr.open('POST', '/viewPurchases', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(`usrName=${usrName}`);
}


function redirectToListing() {
    window.location.href = '/listing.html';
}

function updateUser() {
    var cookieValue = getCook('username');
    username = cookieValue;
    if (cookieValue) {
        document.getElementById("welcome-message").innerText = "Welcome " + cookieValue;
    }
}

function updateUserOnly() {
    var cookieVal = getCook('username');
    username = cookieVal;
}

function getCook(cookiename) {
    // Get name followed by anything except a semicolon
    var cookiestring=RegExp(cookiename+"=[^;]+").exec(document.cookie);
    // Return everything after the equal sign, or an empty string if the cookie name not found
    return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
}

function purchase(item) {
    updateUserOnly();
    var usrName = username;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/purchaseItem', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(`usrName=${usrName}&title=${item.title}&price=${item.price}&desc=${item.description}`);
}

