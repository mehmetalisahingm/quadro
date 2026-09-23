# Quadro ses varlıkları

Q31 kapsamında harici ses dosyası kullanılmıyor.

Seçim, yanlış, çok yakın, doğru ve bitiş geri bildirimleri tarayıcının Web Audio API'si ile çalışma anında kısa tonlardan sentezlenir. Böylece üçüncü taraf lisansı, telif kaydı veya indirilen ses paketi yoktur.

Sesler yalnız kullanıcı tercihi açıkken çalar. İlk kullanımda ses kapalıdır; açma işlemi doğrudan kullanıcı tıklamasında `AudioContext` oluşturup/resume ederek mobil Safari ve Chromium autoplay kurallarıyla uyumlu davranır.

Kaynak: `src/components/settings/gameSound.ts`
