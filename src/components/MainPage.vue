<template>
  <div>
    <div class="flex align-middle">
      <input
        id="twd"
        v-model="currencyType"
        type="radio"
        class="mx-1"
        @change="fetchData"
        value="twd" />
      <label for="twd" class="pe-5 text-md text-gray-700 uppercase">TWD</label>
      <input
        id="cad"
        v-model="currencyType"
        type="radio"
        class="mx-1"
        @change="fetchData"
        value="cad" />
      <label for="cad" class="pe-5 text-md text-gray-700 uppercase">CAD</label>
    </div>
    <table class="w-full text-sm text-left text-gray-500 mb-5">
      <thead class="text-md text-gray-700 uppercase bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3">Country</th>
          <th scope="col" class="px-6 py-3">Currency</th>
          <th scope="col" class="px-6 py-3">6480</th>
          <th scope="col" class="px-6 py-3">In {{ currencyType }}</th>
          <th scope="col" class="px-6 py-3">Difference</th>
          <th scope="col" class="px-6 py-3">Today</th>
          <th scope="col" class="px-6 py-3">Higest</th>
          <th scope="col" class="px-6 py-3">Lowest</th>
          <th scope="col" class="px-6 py-3">Average</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bg-white border-b">
          <td class="px-6 py-4">Japan</td>
          <td class="px-6 py-4">JPY</td>
          <td class="px-6 py-4">12,000</td>
          <td class="px-6 py-4">{{ currency(inCurrency) }}</td>
          <td class="px-6 py-4">{{ currency(calcDifference) }}</td>
          <td class="px-6 py-4">{{ currency(todayRate) }}</td>
          <td class="px-6 py-4">{{ currency(highest) }}</td>
          <td class="px-6 py-4">{{ currency(lowest) }}</td>
          <td class="px-6 py-4">{{ currency(calcAverage) }}</td>
        </tr>
      </tbody>
    </table>
    <div ref="echart" class="mx-auto" style="width: 800px; height: 500px"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from "vue";
import axios from "axios";
import * as echarts from "echarts";
import { currency } from "../utils/currency";
import moment from "moment-timezone";

// switch between CAD and TWD
const currencyType = ref("twd");

// get today's data
const latestData = ref();
const todayRate = ref();
const cstDate = moment.tz("America/Chicago").format("YYYY-MM-DD");

const getLastestData = () => {
  axios
    .get(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${cstDate}/currencies/${currencyType.value}/jpy.json`
    )
    .then((res) => {
      latestData.value = res.data;
      todayRate.value = res.data.jpy;
    })
    .catch((err) => console.log(err));
};

// get the dates for the past 30 days
const dates = ref([]);
const dataAxis = ref([]);
const getDates = () => {
  const today = moment(cstDate, "YYYY-MM-DD");

  for (let i = 0; i < 30; i++) {
    dates.value.push(today.clone().subtract(i, "days").format("YYYY-MM-DD"));
  }
  dates.value = dates.value.reverse();
  for (let i = 0; i < dates.value.length; i++) {
    dataAxis.value.push(dates.value[i]);
  }
};

// get the data for the past 30 days
const pastData = ref([]);
const allData = ref([]);
const getAllData = async () => {
  try {
    const responses = await Promise.all(
      dates.value.map(async (date) => {
        try {
          const response = await axios.get(
            `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${date}/currencies/${currencyType.value}/jpy.json`
          );
          return response.data;
        } catch (error) {
          console.error(`Error for date ${date}:`, error);
          return { date, jpy: null };
        }
      })
    );

    pastData.value = responses;
    allData.value = responses.map((data) => data.jpy);
  } catch (error) {
    console.error("Error:", error);
  }
};

// calculating the difference after applying exchange rate
const calcDifference = computed(() => {
  if (!latestData.value || !latestData.value.jpy) {
    return "error";
  }
  if (currencyType.value === "twd") {
    return 3290 - 12000 / latestData.value.jpy;
  } else {
    return 129.99 - 12000 / latestData.value.jpy;
  }
});

// shows the price in TWD after applying exchange rate
const inCurrency = computed(() => {
  if (!latestData.value || !latestData.value.jpy) {
    return "error";
  }
  return 12000 / latestData.value.jpy;
});

// calculate the average rate for the past 30 days
const calcAverage = computed(() => {
  const sum = allData.value.reduce((acc, curr) => acc + curr, 0);
  const average = sum / allData.value.length;
  return average;
});

// calculate the highest and lowest for the past 30 days
const highest = computed(() => Math.max(...allData.value));
const lowest = computed(() => {
  const nonNullValues = allData.value.filter((value) => value !== null);
  return nonNullValues.length > 0 ? Math.min(...nonNullValues) : null;
});

//chart related settings
const chart = shallowRef(null);
const echart = ref(null);
const initChart = () => {
  chart.value = echarts.init(echart.value);
  setOptions();
};

const setOptions = () => {
  chart.value.setOption({
    title: {
      text: "Exchange Rate for the Past 30 Days",
      left: "center",
      textStyle: {
        fontStyle: "italic",
      },
    },
    xAxis: {
      data: dataAxis.value,
      name: "DATE",
      nameTextStyle: {
        fontWeight: "bold",
        fontSize: "14",
      },
      axisLabel: {
        rotate: 60,
        interval: 3,
      },
    },
    yAxis: {
      min: Math.floor(lowest.value*100)/100,
      max: Math.ceil(highest.value*100)/100,
      type: "value",
      name: "EXCHANGE RATE",
      nameTextStyle: {
        fontWeight: "bold",
        fontSize: "14",
      },
    },
    tooltip: {
      trigger: "axis",
    },
    series: [
      {
        name: "exchange rate",
        type: "line",
        data: allData.value,
      },
    ],
  });
};

const fetchData = async () => {
  dates.value = [];
  allData.value = [];
  dataAxis.value = [];
  pastData.value = [];
  getLastestData();
  getDates();
  await getAllData();
  setOptions();
};

onMounted(async () => {
  getLastestData();
  getDates();
  await getAllData();
  initChart();
});
</script>
