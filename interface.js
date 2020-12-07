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



async function updateProgressbar(){
    $.ajax({
        url: globalThis.progressLink,
        success: function(data){
            $("#detectionProgressbar").css("width", data.currentFrame/data.frameCount);
            $("#detectionProgressbar").text(Math.round(data.currentFrame/data.frameCount, 2));
        }
    })

    $("#detectionProgressbar")
}

function setUrls(url, params)
{
    globalThis.serverHost = url;
    globalThis.serverLink = globalThis.serverHost + params.detect;
    globalThis.progressLink = globalThis.serverHost + params.result;
}

setUrls("http://127.0.0.1:5000", {detect:'/detect', result:'/result'});