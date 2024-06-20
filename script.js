var mapContainer = document.getElementById('map'), 
    mapOption = { 
        center: new kakao.maps.LatLng(37.56924, 126.95674), // 기본 지도 중심 좌표
        level: 3 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); 
var selectedOverlay = null;
var selectedPolyline = null;
var geocoder = new kakao.maps.services.Geocoder();
var overlayCount = 0; // 오버레이 생성 횟수를 저장할 변수

document.getElementById('openPopupBtn').addEventListener('click', function() {
    var popup = document.getElementById('popup');
    popup.style.display = 'block';
    popup.style.position = 'absolute';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    document.getElementById('contextMenu').style.display = 'none';
});

document.getElementById('submitBtn').addEventListener('click', function() {
    const address = document.getElementById('address').value;
    const customData = document.getElementById('customData').value;
    const extraData = document.getElementById('extraData').value;
    const color = document.getElementById('color').value || "#808080"; // 기본 색상 회색

    if (address && customData && extraData) {
        geocoder.addressSearch(address, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                overlayCount++; // 오버레이 생성 횟수를 증가시킴
                var coords = new kakao.maps.LatLng(result[0].y, result[0].x);

                var content = document.createElement('div');
                content.className = 'overlay';
                content.style.borderColor = color;
                content.innerHTML = '<table>' +
                                    '   <tbody>' +
                                    '       <tr>' +
                                    '           <th colspan="3" style="background-color:' + color + ';">' + '# ' + overlayCount + '</th>' +
                                    '       </tr>' +
                                    '       <tr>' +
                                    '           <td>' + address + '</td>' +
                                    '       </tr>' +
                                    '       <tr>' +
                                    '           <td>' + customData + '</td>' +
                                    '       </tr>' +
                                    '       <tr>' +
                                    '           <td>' + extraData + '</td>' +
                                    '       </tr>' +
                                    '   </tbody>' +
                                    '</table>';

                var overlay = new kakao.maps.CustomOverlay({
                    map: map,
                    position: coords,
                    content: content,
                    yAnchor: 1 
                });

                // 지시선 생성
                var polyline = new kakao.maps.Polyline({
                    path: [coords, coords], // 선을 구성하는 좌표배열
                    strokeWeight: 2, // 선의 두께
                    strokeColor: color, // 선의 색깔
                    strokeOpacity: 1.0, // 선의 불투명도 0 ~ 1
                    strokeStyle: 'solid' // 선의 스타일
                });

                polyline.setMap(map);

                // 드래그 앤 드롭 기능 추가
                content.addEventListener('mousedown', function(e) {
                    var startX = e.clientX;
                    var startY = e.clientY;
                    var overlayPosition = overlay.getPosition();

                    // 맵 드래그 기능 비활성화
                    map.setDraggable(false);

                    function onMouseMove(event) {
                        var deltaX = event.clientX - startX;
                        var deltaY = startY - event.clientY; // Y축 방향 수정
                        var newLat = overlayPosition.getLat() + deltaY * 0.00001;
                        var newLng = overlayPosition.getLng() + deltaX * 0.00001;
                        
                        var newPosition = new kakao.maps.LatLng(newLat, newLng);
                        overlay.setPosition(newPosition);
                        polyline.setPath([coords, newPosition]);
                    }

                    document.addEventListener('mousemove', onMouseMove);

                    document.addEventListener('mouseup', function() {
                        document.removeEventListener('mousemove', onMouseMove);

                        // 맵 드래그 기능 활성화
                        map.setDraggable(true);
                    }, { once: true });
                });

                content.ondragstart = function() {
                    return false;
                };

                content.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    selectedOverlay = overlay;
                    selectedPolyline = polyline;
                    var contextMenu = document.getElementById('contextMenu');
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = e.pageX + 'px';
                    contextMenu.style.top = e.pageY + 'px';
                });

                map.setCenter(coords); // 입력된 주소로 지도를 이동
                document.getElementById('popup').style.display = 'none';
            } else {
                alert('주소 검색 결과가 없습니다.');
            }
        });
    } else {
        alert('모든 필드를 입력해주세요.');
    }
});

document.getElementById('applyColorBtn').addEventListener('click', function() {
    var newColor = document.getElementById('newColor').value;
    if (newColor && selectedOverlay && selectedPolyline) {
        selectedOverlay.getContent().style.borderColor = newColor;
        var header = selectedOverlay.getContent().querySelector('th[colspan="3"]');
        if (header) {
            header.style.backgroundColor = newColor;
        }
        selectedPolyline.setOptions({
            strokeColor: newColor
        });
    }
    document.getElementById('colorPickerPopup').style.display = 'none';
});

document.getElementById('deleteBtn').addEventListener('click', function() {
    var confirmation = confirm("정말 삭제하시겠습니까?");
    if (confirmation) {
        if (selectedOverlay) {
            selectedOverlay.setMap(null);
            selectedOverlay = null;
        }
        if (selectedPolyline) {
            selectedPolyline.setMap(null);
            selectedPolyline = null;
        }
    }
    document.getElementById('contextMenu').style.display = 'none';
});

document.getElementById('editBtn').addEventListener('click', function() {
    if (selectedOverlay) {
        var popup = document.getElementById('popup');
        popup.style.display = 'block';
        popup.style.position = 'absolute';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';

        document.getElementById('address').value = selectedOverlay.getContent().querySelector('td:nth-child(1)').innerText;
        document.getElementById('customData').value = selectedOverlay.getContent().querySelector('td:nth-child(2)').innerText;
        document.getElementById('extraData').value = selectedOverlay.getContent().querySelector('td:nth-child(3)').innerText;
        document.getElementById('color').value = rgbToHex(selectedOverlay.getContent().style.borderColor);
        
        document.getElementById('submitBtn').onclick = function() {
            const newAddress = document.getElementById('address').value;
            const newCustomData = document.getElementById('customData').value;
            const newExtraData = document.getElementById('extraData').value;
            const newColor = document.getElementById('color').value;

            if (newAddress && newCustomData && newExtraData) {
                geocoder.addressSearch(newAddress, function(result, status) {
                    if (status === kakao.maps.services.Status.OK) {
                        var newCoords = new kakao.maps.LatLng(result[0].y, result[0].x);
                        updateOverlay(selectedOverlay, selectedPolyline, newCoords, newAddress, newCustomData, newExtraData, newColor);
                        map.setCenter(newCoords); // 수정된 주소로 지도를 이동
                        document.getElementById('popup').style.display = 'none';
                        selectedOverlay = null; // 선택된 오버레이 초기화
                        selectedPolyline = null; // 선택된 지시선 초기화
                    } else {
                        alert('주소 검색 결과가 없습니다.');
                    }
                });
            } else {
                alert('모든 필드를 입력해주세요.');
            }
        };
    }
    document.getElementById('contextMenu').style.display = 'none';
});

function updateOverlay(overlay, polyline, coords, address, customData, extraData, color) {
    var content = overlay.getContent();
    content.querySelector('th[colspan="3"]').innerText = '# ' + overlayCount;
    content.querySelector('td:nth-child(1)').innerText = address;
    content.querySelector('td:nth-child(2)').innerText = customData;
    content.querySelector('td:nth-child(3)').innerText = extraData;
    content.style.borderColor = color;
    overlay.setPosition(coords);
    polyline.setPath([coords, coords]);
    polyline.setOptions({ strokeColor: color });
}

function rgbToHex(rgb) {
    var rgbValues = rgb.match(/\d+/g).map(Number);
    var hex = '#' + rgbValues.map(function(value) {
        return ('0' + value.toString(16)).slice(-2);
    }).join('');
    return hex;
}

// 외부 클릭 시 팝업 창 숨기기
document.addEventListener('click', function(event) {
    var popup = document.getElementById('popup');
    var colorPickerPopup = document.getElementById('colorPickerPopup');
    var contextMenu = document.getElementById('contextMenu');

    if (!popup.contains(event.target) && !document.getElementById('openPopupBtn').contains(event.target) && popup.style.display === 'block') {
        popup.style.display = 'none';
    }

    if (!colorPickerPopup.contains(event.target) && colorPickerPopup.style.display === 'block') {
        colorPickerPopup.style.display = 'none';
    }

    if (!contextMenu.contains(event.target) && contextMenu.style.display === 'block') {
        contextMenu.style.display = 'none';
    }
});
