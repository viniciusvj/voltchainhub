# VoltchainHub metering node (ESP32-S3). Build with ESP-IDF v5.x:
#   idf.py set-target esp32s3
#   idf.py build
cmake_minimum_required(VERSION 3.16)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(voltchain_node)
