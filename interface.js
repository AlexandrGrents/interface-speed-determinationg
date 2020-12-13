globalThis.videos = {'kompol-11s':"./input.mp4"}

$( "#road-region-select" ).change(function() {
    if (this.value == "custom") $("#custom-road-region-files").show();
    else $("#custom-road-region-files").hide();
    });

$( "#video-select" ).change(function() {
    if (this.value == "custom") {
        $("#video-form").show();
        setVideoFileUrl();
    }
    else $("#video-form").hide();

    if (this.value == "kompol-11s") setVideoFileUrl(globalThis.videos[this.value], "video/mp4")
});

$("#mask-file").change(function(){showUploadImage(this, "#mask-view")});
    
let STATE = {UPLOAD: 1, PROGRESS: 2, DOWNLOAD: 3};

class InterfaceState {
    constructor(state = null) {
        this.uploadSection = document.getElementById('sendVideoForm');
        this.progressSection = document.getElementById('detectionProccess');
        this.downloadSection = document.getElementById('downloadResult');
        if (state) this.setState(state);
        this.progressUpdateTimerId = null;
    }
    setState(state, processId)
    {
        this.uploadSection.hidden = true;
        this.progressSection.hidden = true;
        this.downloadSection.hidden = true;

        if (state===STATE.UPLOAD) {
            this.uploadSection.hidden = false;
            clearTimeout(this.progressUpdateTimerId);
        }

        else if (state === STATE.PROGRESS) {
            this.progressSection.hidden = false;
        }

        else if (state === STATE.DOWNLOAD) {
            this.downloadSection.hidden = false;
            clearTimeout(this.progressUpdateTimerId);
        }
    }
}

let interfaceState = new InterfaceState(STATE.UPLOAD);
document.getElementById("to-upload-state").onclick = () => interfaceState.setState(STATE.UPLOAD);


function setVideoFileUrl(url, type) {
    if (url && type) {
        $("#video-view").show();
        $("#video-view>video").attr("src",url);
        $("#video-view>video").attr("type",type);
        return;
    }
    let file = document.getElementById("video-file").files[0];
    if (file){
        $("#video-view").show();
        
        let regexp = /mp4$/i;
        if (regexp.test(file.name)) $("#video-view>video").attr("type","video/mp4");
        else $("#video-view>video").attr("type","");

        $("#video-view>video").attr("src",URL.createObjectURL(file));
    }
    else $("#video-view").hide();
}

function showUploadImage(form, showImageElementSelector)
{

    let file = form.files[0];
    console.log(file.name);
    if (file)
    {
        $(showImageElementSelector).show();
        $(showImageElementSelector).attr("src", URL.createObjectURL(file));
    }
    else $(showImageElementSelector).hide();

}

$("#video-file").change(setVideoFileUrl);


$("#video-file").change();
$("#video-select" ).change();
$("#road-region-select" ).change();


$("#sendVideoForm").submit(function(e){
    e.preventDefault();
    
    let body = getFormData();
    if (!body) return;

    $.ajax({
        url: globalThis.serverLink,
        type: "POST",
        data: body,
        processData: false,
        contentType: false,
        success: function(data){ 
            console.log(data);
            console.log('success');
            setTimeout(() => checkProcess(data.id),2000);
        },
        error: function (error) {
            alert('Server not run or error on server. Write to alx.grents@gmail.com');
        }
    });
    console.log(Object.fromEntries(body))
    console.log('send');
    return false;
});

function getFormData(){
    let body = new FormData();

    let video = $("#video-select").val();
    if (video == "custom") {
        body.set("video", "custom");
        let file = document.getElementById('video-file').files[0];
        if (file) body.set("video-file", file, file.name);
        else {
            alert("Укажите видео-файл");
            return false;   
        }
    }
    else body.set("video", video);

    let roadRegion = $("#road-region-select").val();
    if (roadRegion == "custom")
    {
        body.set("roadRegion", "custom");

        let coefsFile = document.getElementById('coefs-file').files[0];
        let maskFile = document.getElementById('mask-file').files[0];

        if (coefsFile && maskFile) {
            body.set("coefsFile", coefsFile, coefsFile.name);
            body.set("maskFile", maskFile, maskFile.name);
        }
        else {
            alert("Укажите файлы с маской и коэффициентами")
            return false;
        }
    }
    else body.set("roadRegion", roadRegion);


    let outputFormat = $('input[name="outputParameters"]:checked').val();
    body.set("outputFormat", outputFormat);
    
    body.set("bbox", $("#bbox").prop("checked"))
    body.set("class", $("#class").prop("checked"))
    body.set("position", $("#position").prop("checked"))
    body.set("speed", $("#speed").prop("checked"))

    return body;
}

globalThis.serverLink = location.href;

async function checkProcess(processId)
{
    console.log('check on', processId)
    $.ajax({
        url: globalThis.progressLink + '/' + processId,
        success: function (data) {
            if (data.status == 'run')
            {
                updateProgressbar(data)
                interfaceState.setState(STATE.PROGRESS, processId)
                if (interfaceState.progressUpdateTimerId === null)
                {
                    interfaceState.progressUpdateTimerId = setInterval(checkProcess, 5000, processId)
                }

            }
            else if (data.status == 'end')
            {
                interfaceState.setState(STATE.DOWNLOAD);

                setDownloadLinks(data)
            }
            else if (data.status == 'start')
            {
                interfaceState.setState(STATE.PROGRESS)
            }
        },
        error: function (error) {
            interfaceState.setState(STATE.UPLOAD)

        }
    })
}

function updateProgressbar(data){
    console.log(data)
    $("#detectionProgressbar").attr("aria-valuenow", data.currentFrame);
    $("#detectionProgressbar").attr("aria-valuemax", data.frameCount);
    $("#detectionProgressbar").css("width", 100* data.currentFrame/data.frameCount + '%');
    $("#detectionProgressbar").text(Math.round(100* data.currentFrame/data.frameCount, 2) + '%');
}

function setDownloadLinks(data) {
    console.log(data)
    if (data.mp4 && data.webm){
        let mp4Link = globalThis.files + '/' + data.mp4;
        let webmLink = globalThis.files + '/' + data.webm;
        $("#video-download>video").attr('src', webmLink);

        $("#download-mp4-file").attr('href', mp4Link);
        $("#download-webm-file").attr('href', webmLink);

        $("#video-download>video").hidden = false;
        $("#download-mp4-file").hidden = false;
        $("#download-webm-file").hidden = false;

    }
    else {
        $("#video-download>video").hidden = true;
        $("#download-video-file").hidden = true;
    }

    if (data.json)
    {
        let jsonLink = globalThis.files + '/' + data.json;
        $("#download-json-file").attr('href', jsonLink);
        $("#download-json-file").hidden = false;
    }
    else {
        $("#download-json-file").hidden = true;
    }

    setResultLink(data.id)

}

function setResultLink(processId)
{
    let processLink = new URL(location.href);
    processLink.searchParams.set('processId', processId)

    $(".url-for-result>a").text(processLink);
    $(".url-for-result>a").attr('href', processLink)
}

function setUrls(url, params)
{
    globalThis.serverHost = url;
    globalThis.serverLink = globalThis.serverHost + params.detect;
    globalThis.progressLink = globalThis.serverHost + params.result;
    globalThis.files = globalThis.serverHost + '/file'
}



async function setUrlsFromProxy()
{
    $.ajax({
        url: "https://speed-detection-proxy.herokuapp.com/server",
        success: function (data)
        {
            setUrls(data.host, data)
        }
    })
}

async function start(){
    let url = new URL(location.href);
    let processId = url.searchParams.get('processId');
    setUrlsFromProxy();
    if (processId)
    {
        console.log('processId', processId)
        setTimeout(() => checkProcess(processId), 1000);
    }


}
document.addEventListener("DOMContentLoaded", start);