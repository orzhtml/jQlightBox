/*!
 * User: carson
 * Date: 16-12-27 下午5:16
 * Contact way: QQ77642304
 * Detail: 
 * 功能：鼠标滚轮放大缩小、旋转图片、拖动窗口、自适应屏幕大小
 * url: http://orzcss.com/
 */

! function ($) {
    $(function () {
        var $lightBox = $('.light-box');
        $('.enter').on('click', function () {
            var $this = $(this);
            var $img = $this.find('.img');
            var $lightBoxImg = $lightBox.find('.img');

            var url = $img.data('big');
            var title = $img.attr('title');

            $lightBox.find('.layer').addClass('active');

            changeImage($lightBoxImg, url);

            $lightBox.addClass('show').find('.title').text(title);
            setTimeout(function () {
                $lightBox.addClass('show-visible');
            }, 100);
        });

        $lightBox.find('[data-role="close"]').on('click', function () {
            var $this = $(this);
            if (!$this.hasClass('active')) {
                $this.addClass('active');
                lightBoxClose();
            }
        });

        $lightBox.on('click', function (e) {
            var $target = $(e.target);
            if (!$target.parents('.light-box-cnt').first().length) {
                lightBoxClose();
            }
        });

        $lightBox.find('[data-role="rotate"]').on('click', function () {
            var $this = $(this);
            if ($this.hasClass('active')) {
                return;
            }

            $this.addClass('active');

            var $layer = $lightBox.find('.layer');
            var $img = $lightBox.find('.img');

            $layer.addClass('active');

            var new_img = new Image();
            var canvas = document.createElement('canvas');
            var cxt = canvas.getContext('2d');

            var hh = 0;
            var ww = 0;

            new_img.onload = function () {
                $this.removeClass('active');
                hh = new_img.height;
                ww = new_img.width;
                canvas.width = hh;
                canvas.height = ww;
                cxt.translate(hh, 0);
                cxt.rotate(90 * Math.PI / 180);
                cxt.drawImage(new_img, 0, 0);
                changeImage($img, canvas.toDataURL())
            };

            new_img.src = $img.attr('src');
        });

        //=======移动=======//
        var dragToggle = false;
        var leftLength, topLength;
        $lightBox.find('.light-box-cnt').mousedown(function (e) {
            e.stopPropagation();
            e.preventDefault();
            var width = $(this).width();
            var height = $(this).height();
            leftLength = e.pageX - ($(this).position().left + width / 2);
            topLength = e.pageY - ($(this).position().top + height / 2);

            dragToggle = true;
        });
        $(document).mousemove(function (e) {
            if (dragToggle) {
                $lightBox.find('.light-box-cnt').css({
                    'left': e.pageX - leftLength,
                    'top': e.pageY - topLength
                });
            }
        }).mouseup(function () {
            dragToggle = false;
        });

        function lightBoxClose() {
            $lightBox.find('.light-box-cnt').fadeOut(200, function () {
                $lightBox.removeClass('show-visible');
                setTimeout(function () {
                    $lightBox.removeClass('show');
                    $lightBox.find('.light-box-cnt').css({
                        display: ''
                    });
                    $lightBox.find('[data-role="close"]').removeClass('active');
                }, 200);
            });
        }

        function changeImage($lightBoxImg, url) {
            var oldWidth = $lightBox.find('.light-box-cnt').outerWidth();
            var oldHeight = $lightBox.find('.light-box-cnt').outerHeight();
            var preloader = new Image();

            preloader.onload = function () {
                var $win = $(window);
                var maxImageHeight = $win.height() - 175;
                var maxImageWidth = $win.width() - 40;
                var imageWidth = imageHeight = 0;

                $lightBoxImg.attr('src', url);
                $lightBoxImg.width(preloader.width);
                $lightBoxImg.height(preloader.height);

                if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
                    if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
                        imageWidth = maxImageWidth;
                        imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
                        $lightBoxImg.width(imageWidth);
                        $lightBoxImg.height(imageHeight);
                    } else {
                        imageHeight = maxImageHeight;
                        imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
                        $lightBoxImg.width(imageWidth);
                        $lightBoxImg.height(imageHeight);
                    }
                }

                sizeContainer(oldWidth, oldHeight, $lightBoxImg.width(), $lightBoxImg.height());
            };

            preloader.src = url;
        }

        function sizeContainer(oldWidth, oldHeight, imageWidth, imageHeight) {
            var newWidth = imageWidth + 30;
            var newHeight = imageHeight + 75;

            if (oldWidth !== newWidth || oldHeight !== newHeight) {
                $lightBox.find('.light-box-cnt').css({
                    width: oldWidth,
                    height: oldHeight,
                    left: '',
                    top: ''
                }).animate({
                    width: newWidth,
                    height: newHeight
                }, 700, 'swing', function () {
                    postResize();
                });
            } else {
                postResize();
            }
        }

        function postResize() {
            $lightBox.find('.layer').removeClass('active');
            $lightBox.find('.img').fadeIn(600);
        }

        function scrollFunc(e) {
            e = e || window.event;
            e.stopPropagation();
            if ($lightBox.hasClass('show')) {
                e.preventDefault();
            } else {
                return;
            }

            var $img = $lightBox.find('.img');
            var img_h = $img.height();

            if (e.wheelDelta) { //判断浏览器IE，谷歌滑轮事件
                if (e.wheelDelta > 0) { //当滑轮向上滚动时
                    zoom(true);
                }
                if (e.wheelDelta < 0) { //当滑轮向下滚动时
                    zoom(false);
                }
            } else if (e.detail) { //Firefox滑轮事件
                if (e.detail > 0) { //当滑轮向下滚动时
                    zoom(false);
                }
                if (e.detail < 0) { //当滑轮向上滚动时
                    zoom(true);
                }
            }
        }
        //给页面绑定滑轮滚动事件
        if (document.addEventListener) { //firefox
            document.addEventListener('DOMMouseScroll', scrollFunc, false);
        }
        //滚动滑轮触发scrollFunc方法  //ie 谷歌
        window.onmousewheel = document.onmousewheel = scrollFunc;

        function zoom(yes) {
            var $img = $lightBox.find('.img');

            var img_w = $img.width();
            var img_h = $img.height();

            if (yes) {
                $img.css({
                    height: img_h * 1.1,
                    width: img_w * 1.1
                });
            } else {
                if (img_h > 50) {
                    $img.css({
                        height: img_h * .9,
                        width: img_w * .9
                    });
                }
            }

            $lightBox.find('.light-box-cnt').css({
                height: '',
                width: ''
            });
        }

        // 键盘操作
        $(document).on('keydown.keyboard', $.proxy(keyboardAction, this));

        function disableKeyboardNav() {
            $(document).off('.keyboard');
        }

        function keyboardAction() {
            var KEYCODE_ESC = 27;
            var KEYCODE_LEFTARROW = 37;
            var KEYCODE_RIGHTARROW = 39;
            var KEYCODE_ZOOM = 187;
            var KEYCODE_SHRINK = 180;

            var keycode = event.keyCode;
            var key = String.fromCharCode(keycode).toLowerCase();
			console.log(key, keycode);
            if (!$lightBox.hasClass('show')) {
                return;
            }

            if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
                lightBoxClose();
            } else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
                //              if (this.currentImageIndex !== 0) {
                //                  this.changeImage(this.currentImageIndex - 1);
                //              } else if (this.options.wrapAround && this.album.length > 1) {
                //                  this.changeImage(this.album.length - 1);
                //              }
            } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
                //              if (this.currentImageIndex !== this.album.length - 1) {
                //                  this.changeImage(this.currentImageIndex + 1);
                //              } else if (this.options.wrapAround && this.album.length > 1) {
                //                  this.changeImage(0);
                //              }
            } else if (key === '»' || keycode === KEYCODE_ZOOM || key === '&' || keycode === 38) {
                zoom(true);
            } else if (key === '½' || keycode === KEYCODE_SHRINK || key === '(' || keycode === 40) {
                zoom(false);
            }
        }
    });
}(jQuery);