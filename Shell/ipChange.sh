#!/bin/bash
echo "######################################################################################################################"
echo "#This script will get the second NIC configuration to change your first NIC's IP,prefix size,gateway and DNS address.#"
echo "#                                                       WARNING:                                                     #"
echo "#                                        1.THE SECOND NIC MUST BE CONNECTED!                                         #"
echo "#                                    2.THE PREFIX SIZE ONLY SUPPORT 8,16 and 24                                      #"
echo "######################################################################################################################"
eth1="enp4s0"
eth2="enp5s0"
sleep 0.5
addr1=$(nmcli connection show ${eth1} | grep ipv4.addresses | cut -d : -f 2 | tr -d " ")
addr2=$(nmcli connection show ${eth2} | grep ipv4.addresses | cut -d : -f 2 | tr -d " ")
old_addr=${addr1%/*}
if [ ! "${addr2}" ]; then
	echo "The second NIC not be connected!"
	exit 0
fi
prefix1=${addr1#*/}
prefix2=${addr2#*/}
addr1=${addr1%.*}
addr2=${addr2%.*}
if [ "${prefix2}" != 24 ] && [ "${prefix2}" != 16 ] && [ "${prefix2}" != 8 ]; then
	echo "Prefix error!"
	exit 0
fi
if [ "${prefix2}" == 16 ]; then
	addr2=${addr2%.*}".100"
	if [ "${prefix2}" == "${prefix1}" ]; then
		addr1=${addr1%.*}".100"
	fi
fi
if [ "${prefix2}" == 8 ]; then
	addr2=${addr2%%.*}".100.100"
	if [ "${prefix2}" == "${prefix1}" ]; then
		addr1=${addr1%%.*}".100.100"
	fi
fi
if [ "${addr1}" == "${addr2}" ]; then
	echo "At the same subnet."
	exit 0
fi
#Modify all old address
sed -i "3s/${old_addr}/${addr2}.100/g" /vol2/1000/docker/JellyFin/config/plugins/configurations/MetaTube.xml
sed -i "s/${old_addr}/${addr2}.100/g" /vol2/1000/docker/Homepage/app/config/services.yaml
nmcli connection modify ${eth1} ipv4.addresses "${addr2}"".100/""${prefix2}"
nmcli connection modify ${eth1} ipv4.dns "${addr2}"".1"
nmcli connection modify ${eth1} ipv4.gateway "${addr2}"".1"
nmcli connection down ${eth1} && nmcli connection up ${eth1}
