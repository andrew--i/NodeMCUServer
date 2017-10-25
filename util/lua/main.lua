function init_network()
    collectgarbage()
    print(id)
    if wifi.sta.status() ~= 5 then
        print("Reconnecting WIFI")
        wifi.setmode(wifi.STATION)
        wifi.sta.config("asus-220","hiandrew807")
        wifi.sta.connect()
    else
        print("IP: "..wifi.sta.getip())
    end
end

function read_dht(pin)
    status, temp, humi, temp_dec, humi_dec = dht.read(pin)
    if status == dht.OK then
       print("DHT Temperature:"..temp..";".."Humidity:"..humi)    
    elseif status == dht.ERROR_CHECKSUM then
       print( "DHT Checksum error." )
    elseif status == dht.ERROR_TIMEOUT then
       print( "DHT timed out." )
    end
end

init_network()
read_dht(5)
read_dht(6)
read_dht(7)