function startApp() {


    $('header').find('a').show();

    const divAds = $('#ads');





    function showView(view) {
        $('section').hide();
        switch (view){
            case 'home' : $('#viewHome').show();
                break;
            case 'login' : $('#viewLogin').show();
                break;
            case 'register' : $('#viewRegister').show();
                break;
            case 'ads' :
                $('#viewAds').show();
                loadAds();
                break;
            case 'createAds' : $('#viewCreateAd').show();
                break;
            case 'details' : $('#viewDetailsAds').show();
                break;
            case 'edit' : $('#viewEditAd').show();
                break;
        }
    };
    function navigateTo(e) {
        $('section').hide();
        let target = $(e.target).attr("data-target");
        $("#"+target).show();

    };

    // Attach event listeners
    $('#linkHome').click(()=>showView('home'));
    $('#linkLogin').click(()=>showView('login'));
    $('#linkRegister').click(()=>showView('register'));
    $('#linkListAds').click(()=>showView('ads'));
    $('#linkCreateAd').click(()=>showView('createAds'));
    $("#linkLogout").click(logout);
    $("#buttonCreateAd").click(createAd);
    $("#buttonLoginUser").click(login);
    $("#buttonRegisterUser").click(register);
    $('.test').click(test);


    function test(){
        console.warn("Test")
    };

    //Notification
    $(document).on({
        ajaxStart: ()=> $('#loadingBox').show(),
        ajaxStop: ()=> $('#loadingBox').fadeOut()
    });

    $('#infoBox').click((event)=> $(event.target).hide());
    $('#errorBox').click((event)=> $(event.target).hide());

    function showInfo(messege) {
        $('#infoBox').text(messege);
        $('#infoBox').show();
        setTimeout(()=> $('#infoBox').fadeOut(),3000)
    }
    function showError(messege) {
        $('#errorBox').text(messege);
        $('#errorBox').show();
    }
    function handleError(reason) {
        showError(reason.responseJSON.description)
    }

    let requester = (() => {

        const baseUrl = "https://baas.kinvey.com/";
        const appKey = "kid_HJu6D9vvZ";
        const appSecret = "95ade959e71e4b1eab8240d1fc1399fd";

        function makeAuth(type) {

            if (type==='basic'){
                return "Basic " + btoa(appKey+":"+appSecret);
            }else{
                return "Kinvey "+localStorage.getItem("authtoken");
            }

        }

        function makeRequest(method,module,url,auth) {

            return  req= {
                url:baseUrl + module + "/" + appKey + "/" +  url,
                method,
                headers:{
                    "Authorization":makeAuth(auth)
                }
            }
        }

        function get(module,url,auth) {
            console.log("get");
            return $.ajax(makeRequest("GET",module,url,auth))
        }

        function post(module,url,data,auth) {

            let req = makeRequest("POST",module,url,auth);
            req.data =JSON.stringify(data);
            req.headers["Content-Type"] = "application/json";
            return $.ajax(req)
        }

        function update(module,url,data,auth) {
            console.log("update");
            let req = makeRequest("PUT",module,url,auth);
            req.data =JSON.stringify(data);
            req.headers["Content-Type"] = "application/json";
            return $.ajax(req)
        }

        function remove(module,url,auth) {

            return $.ajax(makeRequest("DELETE",module,url,auth))
        }
        return {
            get,post,update,remove
        };
    })();

    if (localStorage.getItem("authtoken") !== null &&
        //localStorage.getItem("authtoken") !=="undefined" &&
        localStorage.getItem("username") !== null){
        userLoggedIn();
        showView('home')
    }else {
        userLoggedOut();
        showView('home')
    }

    function userLoggedIn() {
        $(`#loggedInUser`).text(`Welcome, ${localStorage.getItem('username')}!`);
        $(`#loggedInUser`).show();
        $(`#linkLogin`).hide();
        $(`#linkRegister`).hide();
        $(`#linkCreateAd`).show();
        $(`#linkListAds`).show();
        $(`#linkLogout`).show();
    }
    function userLoggedOut() {
        $(`#loggedInUser`).text(``);
        $(`#loggedInUser`).hide();
        $(`#linkLogin`).show();
        $(`#linkRegister`).show();
        $(`#linkCreateAd`).hide();
        $(`#linkListAds`).hide();
        $(`#linkLogout`).hide();
    }
    function saveSession(data) {

        localStorage.setItem("username",data.username);
        localStorage.setItem("id",data._id);
        localStorage.setItem("authtoken",data._kmd.authtoken);
        console.log(localStorage.getItem("authtoken"));

        userLoggedIn();
    }


    async function login() {

        let form = $("#formLogin");
        let username = form.find(`input[name="username"]`).val();
        let password = form.find(`input[name="passwd"]`).val();
        try {
            let data = await requester.post('user','login',{username,password},"basic");
            saveSession(data);
            showInfo("Logged in");
            showView('ads')
        }catch (err){
            handleError(err)
        }

    }
    async function register() {
        let form = $("#formRegister");
        let username = form.find(`input[name="username"]`).val();
        let password = form.find(`input[name="passwd"]`).val();
        try {
            let data = await requester.post('user','',{username,password},"basic");
            showInfo("Registered");
            saveSession(data);
            showView('ads')
        }catch (err){
            handleError(err)
        }


    }
    async function logout() {
        try {
            let data = await requester.post("user","_logout",{authtoken: localStorage.getItem("authtoken")});
            localStorage.clear();
            showInfo("Logged out");
            userLoggedOut();
            showView('home');
        }catch (err){
            handleError(err)
        }
    }
    async function loadAds() {
        let data = await requester.get("appdata","posts");
        divAds.empty();
        if(data.length === 0 ){
            divAds.append("<p>No ads in database</p>");
            return;
        }else {
            for (let ad of data){

                let html = $("<div>");
                html.addClass('ad-box');

                let title = $(`<div class=\"ad-title\">${ad.title}</div>`);
                if (ad._acl.creator === localStorage.getItem("id")) {
                    let deleteBtn = $('<button>&#10006;</button>').click(()=>deleteArt(ad._id));
                    deleteBtn.addClass('ad-control');
                    deleteBtn.appendTo(title);
                    console.log(ad);
                    let editBtn = $('<button>&#9998;</button>').click(()=>openEditAd(ad));
                    editBtn.addClass('ad-control');
                    editBtn.appendTo(title);
                    let viewDetails = $('<button>&#10148;</button>').click(openMoreView(ad));
                    viewDetails.addClass('ad-control');
                    viewDetails.appendTo(title);
                    html.append(title);
                }

                html.append(`<div><img src="${ad.imageUrl}"></div>`);
                html.append(`<div>Price: ${Number(ad.price).toFixed(2)} | By ${ad.publisher}</div>`);
                divAds.append(html);
            }
        }
    }
    async function deleteArt(id) {
        await requester.remove("appdata", "posts/"+id);
        showInfo("Ad deleted");
        showView("ads")
    }
    function openEditAd(ad) {

        let form = $('#formEditAd');
        form.find('input[name="title"]').val(ad.title);
        form.find('textarea[name="description"]').val(ad.description);
        form.find('input[name="price"]').val(Number(ad.price));
        //form.find('input[name="image"]').val(ad.imageUrl);

        let date = ad.date;
        let publisher = ad.publisher;
        let id = ad._id;
        let imageUrl = ad.imageUrl;
        showView('edit');
        form.find("#buttonEditAd").click(() =>editAd(id,imageUrl,date,publisher))
    }
    async  function editAd(id,imageUrl,date,publisher) {
        let form = $('#formEditAd');
      let title = form.find('input[name="title"]').val();
      let description = form.find('textarea[name="description"]').val();
       let price =Number(form.find('input[name="price"]').val());
       //let imageUrl = form.find('input[name="image"]').val();
        if(title.length===0){
            showError("Title cannot be empty");
            return;
        }
        if(price.length===0){
            showError("Price cannot be empty");
            return;
        }
        let editettAd = {
            title,description,price,imageUrl,date,publisher
        };
        try {
            await requester.update("appdata","posts/"+ id,editettAd);
            showInfo("Ad editted");
            showView("ads")
        }catch (err){
            handleError(err)
        }
    }
    async function createAd() {
        $('#formcreatead').empty();
        let form = $('#formCreateAd');

        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price =Number(form.find('input[name="price"]').val());
        let imageUrl = form.find('input[name="image"]').val();
       let date = (new Date()).toString("dd-MM-yyyy");
        let publisher = localStorage.getItem("username");
        if(title.length===0){
           showError("Title cannot be empty");
           return;
        }
        if(price.length===0){
            showError("Price cannot be empty");
        return;
        }
        let newAd = {
            title,description,price,imageUrl,date,publisher
        };
        try {
            await requester.post("appdata","posts",newAd);
            showInfo("Ad created");
            showView("ads")
            /*title = form.find('input[name="title"]').val('');
            description = form.find('textarea[name="description"]').val('');
            price =Number(form.find('input[name="price"]').val(''));
            let imageUrl = form.find('input[name="image"]').val('');*/
        }catch (err){
            handleError(err)
        }

    }
    function openMoreView() {

    }
}