"use strict";


/* ===========================================================
   WeatherVerse
   Main Application Controller
===========================================================*/

/**
 * ===========================================================
 * Configuration
 * ===========================================================
 */

const AppState = {

    authenticated:false,

    currentUser:null,

    currentWeather:null,

    currentTheme:"default",

    unit:"C",

    latitude:null,

    longitude:null

};

const APP_CONFIG = {

    APP_NAME: "WeatherVerse",

    VERSION: "1.0.0",

    DEBUG: true,

    DEFAULT_THEME: "sunny",

    LOADER_DURATION: 1800,

    LOCATION_TIMEOUT: 10000,

    WEATHER_REFRESH_INTERVAL: 10 * 60 * 1000

};

/**
 * ===========================================================
 * Global Application State
 * ===========================================================
 */

const AppState = {

    initialized: false,

    authenticated: false,

    loading: true,

    locationGranted: false,

    currentTheme: APP_CONFIG.DEFAULT_THEME,

    currentWeather: null,

    currentUser: null,

    currentCity: null,

    latitude: null,

    longitude: null

};

/**
 * ===========================================================
 * Main Application
 * ===========================================================
 */

class WeatherVerseApp {

    constructor() {

        this.modules = {};

        this.elements = {};

        this.init();

    }

    /**
     * Start Application
     */

    async init() {

        console.log(
            `%c${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION}`,
            "color:#38bdf8;font-size:18px;font-weight:bold;"
        );

        this.cacheElements();

        this.bindGlobalEvents();

        this.showLoader();

        await this.wait(APP_CONFIG.LOADER_DURATION);

        this.restoreSession();

        this.initializeModules();

        this.hideLoader();

        AppState.initialized = true;

        console.log("✅ WeatherVerse Initialized");

    }

    /**
     * Cache DOM Elements
     */

    cacheElements() {

        this.elements = {

            body: document.body,

            loader:

                document.getElementById("loadingScreen"),

            loginScreen:

                document.getElementById("loginScreen"),

            permissionScreen:

                document.getElementById("permissionScreen"),

            dashboard:

                document.getElementById("dashboard"),

            searchInput:

                document.getElementById("citySearch"),

            weatherContainer:

                document.getElementById("weatherContainer")

        };

    }

    /**
     * Register Modules
     */

    initializeModules() {

        if (typeof AuthManager !== "undefined") {

            this.modules.auth = new AuthManager();

        }

        if (typeof WeatherManager !== "undefined") {

            this.modules.weather = new WeatherManager();

        }

        if (typeof UIManager !== "undefined") {

            this.modules.ui = new UIManager();

        }

        if (typeof AnimationManager !== "undefined") {

            this.modules.animations = new AnimationManager();

        }

    }

    /**
     * Loader
     */

    showLoader() {

        if (!this.elements.loader) return;

        this.elements.loader.classList.remove("hidden");

    }

    hideLoader() {

        if (!this.elements.loader) return;

        this.elements.loader.classList.add("hidden");

    }

    /**
     * Restore Session
     */

    restoreSession() {

        const session = localStorage.getItem("weatherverse-session");

        if (!session) return;

        try {

            AppState.currentUser = JSON.parse(session);

            AppState.authenticated = true;

            console.log("✔ Session Restored");

        }

        catch {

            localStorage.removeItem("weatherverse-session");

        }

    }

    /**
     * Events
     */

    bindGlobalEvents() {

        window.addEventListener(

            "resize",

            () => {

                console.log(

                    "Window:",

                    window.innerWidth,

                    "x",

                    window.innerHeight

                );

            }

        );

        document.addEventListener(

            "visibilitychange",

            () => {

                if (document.hidden) {

                    console.log("Tab Hidden");

                } else {

                    console.log("Tab Active");

                }

            }

        );

    }

    /**
     * Delay Helper
     */

    wait(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

}

/* ===========================================================
   Boot Application
===========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    window.WeatherVerse = new WeatherVerseApp();

});
/* ===========================================================
   WeatherVerse Controller Extension
   Part 2
===========================================================*/

Object.assign(WeatherVerseApp.prototype, {

    /**
     * =======================================================
     * Go To Login Screen
     * =======================================================
     */

    showLogin() {

        this.hideAllScreens();

        if (this.elements.loginScreen) {

            this.elements.loginScreen.classList.remove("hidden");

        }

    },

    /**
     * =======================================================
     * Location Permission Screen
     * =======================================================
     */

    showPermissionScreen() {

        this.hideAllScreens();

        if (this.elements.permissionScreen) {

            this.elements.permissionScreen.classList.remove("hidden");

        }

    },

    /**
     * =======================================================
     * Dashboard
     * =======================================================
     */

    showDashboard() {

        this.hideAllScreens();

        if (this.elements.dashboard) {

            this.elements.dashboard.classList.remove("hidden");

        }

    },

    /**
     * =======================================================
     * Hide Every Screen
     * =======================================================
     */

    hideAllScreens() {

        [

            this.elements.loginScreen,

            this.elements.permissionScreen,

            this.elements.dashboard

        ].forEach(screen => {

            if (screen) {

                screen.classList.add("hidden");

            }

        });

    },

    /**
     * =======================================================
     * Application Flow
     * =======================================================
     */

    async startApplication() {

        console.log("🚀 Starting WeatherVerse...");

        if (!AppState.authenticated) {

            this.showLogin();

            return;

        }

        this.showPermissionScreen();

    },

    /**
     * =======================================================
     * Ask For Location
     * =======================================================
     */

    requestLocation() {

        if (!navigator.geolocation) {

            console.warn("Geolocation not supported");

            this.enableManualSearch();

            return;

        }

        navigator.geolocation.getCurrentPosition(

            (position) => {

                AppState.locationGranted = true;

                AppState.latitude = position.coords.latitude;

                AppState.longitude = position.coords.longitude;

                console.log("📍 Location Granted");

                this.loadWeather();

            },

            (error) => {

                console.warn(error.message);

                this.enableManualSearch();

            },

            {

                enableHighAccuracy: true,

                timeout: APP_CONFIG.LOCATION_TIMEOUT,

                maximumAge: 0

            }

        );

    },

    /**
     * =======================================================
     * Manual Search
     * =======================================================
     */

    enableManualSearch() {

        console.log("🌍 Manual Search Enabled");

        if (this.elements.searchInput) {

            this.elements.searchInput.focus();

        }

    },

    /**
     * =======================================================
     * Load Weather
     * =======================================================
     */

    async loadWeather(city = null) {

        if (!this.modules.weather) {

            console.warn("Weather Module Missing");

            return;

        }

        try {

            this.showLoader();

            let weather;

            if (city) {

                weather = await this.modules.weather.fetchByCity(city);

            } else {

                weather = await this.modules.weather.fetchByCoordinates(

                    AppState.latitude,

                    AppState.longitude

                );

            }

            AppState.currentWeather = weather;

            if (this.modules.ui) {

                this.modules.ui.updateDashboard(weather);

            }

            this.updateTheme(weather);

            this.showDashboard();

        }

        catch(error){

            console.error(error);

            this.showToast(

                "Unable to fetch weather."

            );

        }

        finally{

            this.hideLoader();

        }

    },

    /**
     * =======================================================
     * Theme
     * =======================================================
     */

    updateTheme(weather){

        if(!weather) return;

        let theme="sunny";

        const main=weather.weather[0].main.toLowerCase();

        if(main.includes("rain")){

            theme="rainy";

        }

        else if(main.includes("snow")){

            theme="snow";

        }

        else if(main.includes("cloud")){

            theme="cloudy";

        }

        else if(main.includes("thunder")){

            theme="storm";

        }

        if(this.modules.ui){

            this.modules.ui.applyTheme(theme);

        }

        AppState.currentTheme=theme;

    },

    /**
     * =======================================================
     * Auto Refresh
     * =======================================================
     */

    startWeatherRefresh(){

        setInterval(()=>{

            console.log("🔄 Refreshing Weather...");

            this.loadWeather();

        },

        APP_CONFIG.WEATHER_REFRESH_INTERVAL);

    },

    /**
     * =======================================================
     * Toast
     * =======================================================
     */

    showToast(message){

        console.log("🔔",message);

        if(window.Toastify){

            Toastify({

                text:message,

                duration:3000,

                gravity:"top",

                position:"right",

                close:true,

                style:{

                    background:"#2563eb"

                }

            }).showToast();

        }

    }

});

/* ===========================================================
   Auto Start
===========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    setTimeout(()=>{

        if(window.WeatherVerse){

            window.WeatherVerse.startApplication();

            window.WeatherVerse.startWeatherRefresh();

        }

    },500);

});

/* ===========================================================
   WeatherVerse Final Module Integration
===========================================================*/


window.addEventListener(
    "DOMContentLoaded",
    ()=>{
    
    
        console.log(
            "🚀 Starting WeatherVerse..."
        );
    
    
    
        // Create Modules
    
        window.WeatherVerse = {
    
    
    
            auth:
                new AuthManager(),
    
    
    
            weather:
                new WeatherManager(),
    
    
    
            ui:
                new UIManager(),
    
    
    
            animations:
                new AnimationManager()
    
    
    
        };
    
    
    
    
        console.log(
            "✅ All Modules Connected"
        );
    
    
    
        initializeApplication();
    
    
    
    });
    
    
    
    
    
    
    
    /* ===========================================================
       Application Starter
    ===========================================================*/
    
    
    function initializeApplication(){
    
    
    
        const app =
            window.WeatherVerse;
    
    
    
        /*
           Enable premium animations
        */
    
    
        if(app.animations){
    
    
            app.animations.enablePremiumMode();
    
    
    
        }
    
    
    
    
    
        /*
           Check Login Session
        */
    
    
        if(
    
            app.auth.checkSession()
    
        ){
    
    
            console.log(
    
                "👤 Existing User Found"
    
            );
    
    
    
            showLocationPermission();
    
    
    
        }
    
        else{
    
    
            console.log(
    
                "🔐 User Not Logged In"
    
            );
    
    
            app.auth.showLogin();
    
    
    
        }
    
    
    
    }
    
    
    
    
    
    
    
    /* ===========================================================
       Location Permission Flow
    ===========================================================*/
    
    
    function showLocationPermission(){
    
    
    
        document.getElementById("authScreen")?.classList.add("hidden");
    
        const location =
    
            document.getElementById(
    
                "locationScreen"
    
            );
    
    
    
        if(location){
    
    
            location.classList.remove(
    
                "hidden"
    
            );
    
    
        }
    
    
    }
    
    
    
    
    
    
    
    /* ===========================================================
       Start Weather
    ===========================================================*/
    
    
    async function startWeather(){
    
    
    
        const app =
            window.WeatherVerse;
    
    
    
        try{
    
    
            app.ui.showLoading();
    
    
    
            navigator.geolocation.getCurrentPosition(
    
            async(position)=>{
    
    
                const weather =
    
                await app.weather.fetchByCoordinates(
    
                    position.coords.latitude,
    
                    position.coords.longitude
    
                );
    
    
    
                AppState.currentWeather =
    
                    weather;
    
    
    
                app.ui.updateDashboard(
    
                    weather
    
                );
    
    
    
                app.ui.updateWeatherTheme(
    
                    weather
    
                );
    
    
    
                app.animations.update(
    
                    weather
    
                );
    
    
    
                app.ui.hideLoading();
    
    
    
            },
    
            ()=>{
    
    
                alert(
    
                    "Location denied. Search city manually."
    
                );
    
    
                app.ui.hideLoading();
    
    
    
            });
    
    
    
        }
    
        catch(error){
    
    
            console.error(error);
    
    
            app.ui.hideLoading();
    
    
        }
    
    
    
    }
    
    
    
    
    
    
    
    /* ===========================================================
       Global Buttons
    ===========================================================*/
    
    
    document.addEventListener(
    
    "click",
    
    (event)=>{
    
    
        if(
    
            event.target.id ===
    
            "allowLocation"
    
        ){
    
    
            startWeather();
    
    
        }
    
    
    
    });
    

    window.addEventListener("DOMContentLoaded",()=>{


    console.log("WeatherVerse Loading...");


    window.WeatherVerse = {

        auth:new AuthManager(),

        weather:new WeatherManager(),

        ui:new UIManager(),

        animations:new AnimationManager()

    };


    console.log("Modules Connected");


});

document.addEventListener("click",(e)=>{


    if(e.target.id === "allowLocation"){


        console.log("Allow button clicked");


        navigator.geolocation.getCurrentPosition(

            (position)=>{


                console.log(
                    "Location:",
                    position.coords
                );


                WeatherVerse.weather.fetchByCoordinates(

                    position.coords.latitude,

                    position.coords.longitude

                )
                .then(data=>{


                    console.log(data);


                    WeatherVerse.ui.updateDashboard(data);


                    WeatherVerse.ui.showDashboard();


                });


            },


            (error)=>{


                console.log(
                    "Location Error:",
                    error.message
                );


            }


        );


    }


});