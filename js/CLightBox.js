/*!
 * User: carson
 * Date: 16-12-27 下午5:16
 * Contact way: QQ77642304
 * Detail: 
 * 功能：鼠标滚轮放大缩小、旋转图片、拖动窗口、自适应屏幕大小
 * url: http://orzcss.com/
 */

! function ($, window, document) {
    function CLightBox(elem, options) {
        this.options = $.extend({}, this.constructor.DEFAULTS, options);
        // 储存图片组
        this.album = [];
        this.$window = $(window);
        this.$document = $(document);
        this.$body = $('body');
        this.$vessel = elem;
        // 初始化
        this.init();
    }

    CLightBox.prototype = {
        constructor: CLightBox,
        init: function () {
            var self = this;
            $(document).ready(function () {
                self.trigger();
                self.bind();
            });
        },
        trigger: function () {
            var self = this;
            this.$vessel.on('click.lightbox', this.options.target, function (e) {
                self.start($(e.currentTarget));
            });
        },
        bind: function () {
            var self = this;
            this.$lightbox = $(this.constructor.TEMPLATE());
            this.$lightbox.attr('id', 'CLightBox-' + new Date().getTime());
            this.$body.append(this.$lightbox);
			this.$bar = this.$lightbox.find('.CLightBox-bar');
			this.$toolbar = this.$lightbox.find('.CLightBox-toolbar');
            this.$layer = this.$lightbox.find('.layer');
            this.$container = this.$lightbox.find('.CLightBox-cnt');
            this.$title = this.$lightbox.find('.title');
            this.$img = this.$lightbox.find('.img');
            this.$close = this.$lightbox.find('[data-role="close"]');
            this.$rotate = this.$lightbox.find('[data-role="rotate"]');

            this.$close.on('click', function () {
                var $this = $(this);
                if (!$this.hasClass('active')) {
                    $this.addClass('active');
                    self.close();
                }
            });

            this.$lightbox.on('click', function (e) {
                var $target = $(e.target);
                if (!$target.parents('.CLightBox-cnt').first().length && !$target.hasClass('icon')) {
                    self.close();
                }
            });

            if (this.options.rotate) {
                this.$rotate.on('click', function () {
                    var $this = $(this);
                    if ($this.hasClass('active')) {
                        return;
                    }
                    $this.addClass('active');
                    self.rotate();
                });
            } else {
                this.$rotate.remove();
            }

            if (!this.options.dragToggle) {
                this.dragDrop();
                this.$container.css('cursor', 'inherit');
            }
        },
        start: function ($link) {
            var self = this;

            var name = $link.data('lightbox');
            var $links = '';

            if (name) {
                $links = this.$vessel.find($link.prop('tagName') + '[data-lightbox="' + name + '"]');
            } else {
                $links = this.$vessel.find(this.options.target);
            }

            var imageNumber = 0;

            this.album = [];

            $links.each(function (i) {
                // 填充同一组的内容进数组
                addToAlbum($(this));
                if (this == $link[0]) {
                    // 判断当前选中的图片所在的数组下标
                    imageNumber = i;
                }
            });

            this.$layer.addClass('active');

            this.$lightbox.addClass('show');
            setTimeout(function () {
                self.$lightbox.addClass('show-visible');
            }, 0);

            this.$body.css('overflow', 'hidden');
            this.$title.text(this.album[imageNumber].title);

            this.changeImage(this.album[imageNumber].url);

            if (this.options.dragToggle) {
                this.dragDrop();
            }

            if (this.options.keyboard) {
                this.$document.on('keydown.keyboard', function (e) {
                    self.keyboardAction(e, self);
                });
            }

            if (this.options.mouse) {
                //给页面绑定滑轮滚动事件
                if (document.addEventListener) {
                    // firefox
                    document.addEventListener('DOMMouseScroll', function (e) {
                        self.mouseWheel(e, self);
                    }, false);
                }
                // ie 谷歌
                window.onmousewheel = document.onmousewheel = function (e) {
                    self.mouseWheel(e, self);
                };
            }

            function addToAlbum($link) {
                self.album.push({
                    url: $link.data('url'),
                    title: $link.data('title') || $link.attr('title')
                });
            }
        },
        changeImage: function (url) {
            var self = this;
            var oldWidth = this.$container.outerWidth();
            var oldHeight = this.$container.outerHeight();
            var preloader = new Image();

            preloader.onload = function () {
                var maxImageHeight = self.$window.height() - 175;
                var maxImageWidth = self.$window.width() - 40;
                var imageWidth = imageHeight = 0;

                self.$img.attr('src', url);
                self.$img.width(preloader.width);
                self.$img.height(preloader.height);

                if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
                    if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
                        imageWidth = maxImageWidth;
                        imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
                        self.$img.width(imageWidth);
                        self.$img.height(imageHeight);
                    } else {
                        imageHeight = maxImageHeight;
                        imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
                        self.$img.width(imageWidth);
                        self.$img.height(imageHeight);
                    }
                }

                self.sizeContainer(oldWidth, oldHeight, self.$img.width(), self.$img.height());
            };

            preloader.src = url;
        },
        sizeContainer: function (oldWidth, oldHeight, imageWidth, imageHeight) {
            var self = this;
            var newWidth = imageWidth + 30;
            var newHeight = imageHeight + 75;

            if (oldWidth !== newWidth || oldHeight !== newHeight) {
            		this.$bar.css({
            			left: '',
                    top: ''
            		})
                this.$container.css({
                    width: oldWidth,
                    height: oldHeight
                }).animate({
                    width: newWidth,
                    height: newHeight
                }, 700, 'swing', function () {
                    postResize();
                });
            } else {
                postResize();
            }

            function postResize() {
                self.$layer.removeClass('active');
                self.$img.fadeIn(600);
                self.$rotate.removeClass('active');
                // 是否有回调函数
                if (typeof self.options.callback === 'function') {
                    self.options.callback.call(this);
                }
            }
        },
        dragDrop: function () {
            var self = this,
                leftLength,
                topLength,
                toggle = false;

            this.$bar.on('mousedown', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var width = $(this).width();
                var height = $(this).height();
                leftLength = e.pageX - ($(this).position().left + width / 2);
                topLength = e.pageY - $(this).position().top;
                toggle = true;
            });

            this.$document.on({
                'mousemove.lightbox': function (e) {
                    if (toggle) {
                        self.$bar.css({
                            'left': e.pageX - leftLength,
                            'top': e.pageY - topLength
                        });
                    }
                },
                'mouseup.lightbox': function () {
                    toggle = false;
                }
            });
        },
        rotate: function () {
            var self = this;

            this.$layer.addClass('active');

            var new_img = new Image();
            var canvas = document.createElement('canvas');
            var cxt = canvas.getContext('2d');

            var hh = 0;
            var ww = 0;

            new_img.onload = function () {
                hh = this.height;
                ww = this.width;
                canvas.width = hh;
                canvas.height = ww;
                cxt.translate(hh, 0);
                cxt.rotate(90 * Math.PI / 180);
                cxt.drawImage(this, 0, 0);
                self.changeImage(canvas.toDataURL());
            };

            new_img.src = this.$img.attr('src');
        },
        mouseWheel: function (e, _this) {
            e = e || window.event;
            e.stopPropagation();
            if (_this.$lightbox.hasClass('show')) {
                e.preventDefault();
            } else {
                return;
            }

            var self = _this;
            var img_h = _this.$img.height();

            if (e.wheelDelta) { //判断浏览器IE，谷歌滑轮事件
                if (e.wheelDelta > 0) { //当滑轮向上滚动时
                    zoom(true, self);
                }
                if (e.wheelDelta < 0) { //当滑轮向下滚动时
                    zoom(false, self);
                }
            } else if (e.detail) { //Firefox滑轮事件
                if (e.detail > 0) { //当滑轮向下滚动时
                    zoom(false, self);
                }
                if (e.detail < 0) { //当滑轮向上滚动时
                    zoom(true, self);
                }
            }
        },
        keyboardAction: function (e, _this) {
            var KEYCODE_ESC = 27;
            var KEYCODE_LEFTARROW = 37;
            var KEYCODE_RIGHTARROW = 39;
            var KEYCODE_ZOOM = 187;
            var KEYCODE_SHRINK = 180;
            var KEYCODE_UP = 38;
            var KEYCODE_DOWN = 40;
            var KEYCODE_NEXT = 39;
            var KEYCODE_PREV = 37;

            var self = _this;
            var keycode = e.keyCode;
            var key = String.fromCharCode(keycode).toLowerCase();
            console.log(key, keycode);
            if (!self.$lightbox.hasClass('show')) {
                return;
            }

            if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
                self.close();
            } else if (key === 'p' || keycode === KEYCODE_LEFTARROW || key === '%' || keycode === KEYCODE_PREV) {
                //              if (this.currentImageIndex !== 0) {
                //                  this.changeImage(this.currentImageIndex - 1);
                //              } else if (this.options.wrapAround && this.album.length > 1) {
                //                  this.changeImage(this.album.length - 1);
                //              }
            } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW || key === "'" || keycode === KEYCODE_NEXT) {
                //              if (this.currentImageIndex !== this.album.length - 1) {
                //                  this.changeImage(this.currentImageIndex + 1);
                //              } else if (this.options.wrapAround && this.album.length > 1) {
                //                  this.changeImage(0);
                //              }
            } else if (key === '»' || keycode === KEYCODE_ZOOM || key === '&' || keycode === KEYCODE_UP) {
                zoom(true, self);
            } else if (key === '½' || keycode === KEYCODE_SHRINK || key === '(' || keycode === KEYCODE_DOWN) {
                zoom(false, self);
            }
        },
        close: function () {
            var self = this;
            this.$document.off('mousemove.lightbox').off('mouseup.lightbox').off('keydown.keyboard');
            this.$bar.fadeOut(200, function () {
                self.$lightbox.removeClass('show-visible');
                setTimeout(function () {
                    self.$lightbox.removeClass('show');
                    self.$bar.css({
                    		left: '',
                    		top: '',
                        display: ''
                    });
                    self.$close.removeClass('active');
                    self.$body.css('overflow', '');
                }, 0);
            });
        }
    }

    CLightBox.DEFAULTS = {
        target: '[data-lightbox]',
        rotate: true, // 是否旋转图片
        className: '', // 给弹窗父级添加 className
        dragToggle: true, // 拖拽
        keyboard: true, // 键盘操作
        mouse: true, // 鼠标滚轮放大缩小
        callback: null // 回调函数
    };

    CLightBox.TEMPLATE = function () {
        return '<div class="CLightBox">' +
            '    <div class="CLightBox-bar">' +
            '		 <div class="CLightBox-toolbar">' +
            '            <a class="icon icon-close" data-role="close"></a>' +
            '            <a class="icon icon-rotate" data-role="rotate"></a>' +
            '		 </div>' +
            '    <div class="CLightBox-cnt">' +
            '        <div class="layer"></div>' +
            '        <div class="CLightBox-hd">' +
            '            <div class="title">CLightBox</div>' +
            '        </div>' +
            '        <div class="CLightBox-bd">' +
            '            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2P4////fwAJ+wP9BUNFygAAAABJRU5ErkJggg==" alt="" class="img" />' +
            '        </div>' +
            '        <div class="CLightBox-ft"></div>' +
            '    </div>' +
            '    </div>' +
            '</div>';
    };

    // 放大缩小图片
    function zoom(yes, _this) {
        var img_w = _this.$img.width();
        var img_h = _this.$img.height();

        if (yes) {
            _this.$img.css({
                height: img_h * 1.1,
                width: img_w * 1.1
            });
        } else {
            if (img_h > 50) {
                _this.$img.css({
                    height: img_h * .9,
                    width: img_w * .9
                });
            }
        }

        _this.$container.css({
            height: '',
            width: ''
        });
    }

    $.fn.CLightBox = function (args) {
        return this.each(function () {
            var $el = $(this);
            var plugins = new CLightBox($el, args);
            $el.data("CLightBox", plugins);
        });
    };

    $(document).CLightBox();
}(jQuery, window, document);